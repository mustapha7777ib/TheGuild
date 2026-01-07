const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Pool } = require("@neondatabase/serverless");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const Paystack = require("paystack-api");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const nodemailer = require("nodemailer");

require("dotenv").config();

const SALT_ROUNDS = 10;
const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const connectWithRetry = async () => {
  console.log("⏳ Attempting to connect to Neon...");
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("✅ Connected to Neon PostgreSQL");
  } catch (err) {
    console.error("❌ Connection failed, retrying in 5 seconds...", err.message);
    setTimeout(connectWithRetry, 8080); // Wait 5s and try again
  }
};

connectWithRetry();

pool.on("error", (err) => {
  console.error("❌ Database error:", err.stack);
});

if (!process.env.PAYSTACK_SECRET_KEY) {
  console.error("❌ PAYSTACK_SECRET_KEY is not set in .env file");
  process.exit(1);
}

const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

const sessionStore = new PgSession({
  pool,
  tableName: "session",
});

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));
app.set("trust proxy", 1);

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
const uploadDir = path.join(__dirname, "Uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "Uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });


const ensureAdmin = async (req, res, next) => {
  console.log("ensureAdmin: Cookies =", req.headers.cookie || "No cookies");
  console.log("ensureAdmin: Session ID =", req.sessionID, "User ID =", req.session.userId);
  if (!req.session.userId) {
    console.error("server.js: No user session found");
    return res.status(401).json({ error: "Unauthorized: No session" });
  }
  try {
    const result = await pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [req.session.userId]
    );
    console.log("ensureAdmin: User query result =", result.rows);
    if (result.rows.length === 0) {
      console.error("server.js: User not found for ID:", req.session.userId);
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }
    if (result.rows[0].role !== "admin") {
      console.error("server.js: User is not admin:", req.session.userId, "Role:", result.rows[0].role);
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
  } catch (err) {
    console.error("server.js: Error checking admin role:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
const messagesRouter = express.Router();

messagesRouter.get("/conversations-summary/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (other_id)
        sub.other_id as receiver_id,
        u.first_name, u.last_name,
        sub.content, sub.timestamp
      FROM (
        SELECT 
          CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_id,
          content, timestamp
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY timestamp DESC
      ) sub
      JOIN users u ON u.id = sub.other_id
      ORDER BY other_id, sub.timestamp DESC`,
      [parseInt(userId)]
    );
    console.log(`BACKEND DEBUG: Found ${result.rows.length} conversations`);
    res.json(result.rows);
  } catch (err) {
    console.error("BACKEND ERROR Summary:", err.message);
    res.status(500).send(err.message);
  }
});
messagesRouter.get("/conversations/:userId/:otherUserId", async (req, res) => {
  const { userId, otherUserId } = req.params;
  console.log("server.js: GET /conversations/", userId, "/", otherUserId);
  if (
    !userId ||
    !otherUserId ||
    userId === "undefined" ||
    otherUserId === "undefined"
  ) {
    console.error(
      "server.js: Invalid userId or otherUserId:",
      userId,
      otherUserId
    );
    return res
      .status(400)
      .json({ error: "Missing or invalid userId or otherUserId" });
  }
  try {
    const messages = await pool.query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY timestamp ASC`,
      [parseInt(userId), parseInt(otherUserId)]
    );
  console.log(`BACKEND DEBUG: Found ${messages.rows.length} messages`);
    res.json(messages.rows);
  } catch (err) {
    console.error("BACKEND ERROR Messages:", err.message);
    res.status(500).send(err.message);
  }
});

messagesRouter.post("/", async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  console.log("server.js: POST /messages", { sender_id, receiver_id });
  if (
    !sender_id ||
    !receiver_id ||
    !content ||
    typeof content !== "string" ||
    content.trim() === ""
  ) {
    console.error("server.js: Invalid message data:", {
      sender_id,
      receiver_id,
      content,
    });
    return res
      .status(400)
      .json({ error: "Invalid message content or missing fields" });
  }
  try {
    const artisanCheck = await pool.query(
      `SELECT a.coins 
       FROM users u 
       LEFT JOIN artisans a ON a.id = u.artisanid 
       WHERE u.id = $1`,
      [parseInt(sender_id)]
    );
    console.log(
      "server.js: Artisan coins check for sender",
      sender_id,
      ":",
      artisanCheck.rows
    );
    if (artisanCheck.rows.length > 0 && artisanCheck.rows[0].coins !== null) {
      const coins = artisanCheck.rows[0].coins;
      const firstReplyCheck = await pool.query(
        `SELECT COUNT(*) FROM messages
         WHERE sender_id = $1 AND receiver_id = $2`,
        [parseInt(sender_id), parseInt(receiver_id)]
      );
      console.log("server.js: First reply check:", firstReplyCheck.rows[0].count);
      if (parseInt(firstReplyCheck.rows[0].count) === 0) {
        if (coins < 25) {
          console.error(
            "server.js: Insufficient coins for sender",
            sender_id,
            ":",
            coins
          );
          return res
            .status(403)
            .json({ error: "Insufficient coins. Please purchase more." });
        }
        const artisanIdResult = await pool.query(
          `SELECT artisanid FROM users WHERE id = $1`,
          [parseInt(sender_id)]
        );
        console.log(
          "server.js: Artisan ID for sender",
          sender_id,
          ":",
          artisanIdResult.rows
        );
        if (artisanIdResult.rows[0].artisanid) {
          const updateResult = await pool.query(
            `UPDATE artisans SET coins = coins - 25 WHERE id = $1 RETURNING coins`,
            [parseInt(artisanIdResult.rows[0].artisanid)]
          );
          console.log(
            "server.js: Coins updated for artisan",
            artisanIdResult.rows[0].artisanid,
            ":",
            updateResult.rows[0].coins
          );
        }
      }
    }
    const newMessage = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, read)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [parseInt(sender_id), parseInt(receiver_id), content]
    );
    console.log("server.js: Message sent:", newMessage.rows[0]);
    res.json(newMessage.rows[0]);
  } catch (err) {
    console.error("Error sending message:", err.message, err.stack);
    res.status(500).json({ error: "Server error" });
  }
});

messagesRouter.patch("/mark-as-read", async (req, res) => {
  const { sender_id, receiver_id } = req.body;
  console.log("server.js: PATCH /mark-as-read", { sender_id, receiver_id });
  if (!sender_id || !receiver_id) {
    console.error("server.js: Missing sender_id or receiver_id:", {
      sender_id,
      receiver_id,
    });
    return res
      .status(400)
      .json({ error: "Missing sender_id or receiver_id" });
  }
  try {
    const result = await pool.query(
      `UPDATE messages
       SET read = true
       WHERE sender_id = $1 AND receiver_id = $2 AND read = false
       RETURNING *`,
      [parseInt(sender_id), parseInt(receiver_id)]
    );
    console.log("server.js: Messages marked as read:", result.rows.length);
    res.json({ message: "Messages marked as read", updated: result.rows });
  } catch (err) {
    console.error("Error marking messages as read:", err.message, err.stack);
    res.status(500).json({ error: "Server error" });
  }
});

app.use("/api/messages", messagesRouter);

// User-related endpoints
app.post("/artisan/:id/add-job-posting", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { dealId, description } = req.body;
  const image = req.file ? req.file.filename : null;
  console.log("server.js: POST /artisan/", id, "/add-job-posting", {
    dealId,
    description,
    image,
  });
  if (!id || !dealId || !description || !image) {
    console.error("server.js: Missing required fields:", {
      id,
      dealId,
      description,
      image,
    });
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const dealCheck = await pool.query(
      `SELECT id FROM deals WHERE id = $1 AND artisan_id = $2`,
      [parseInt(dealId), parseInt(id)]
    );
    console.log(
      "server.js: Deal check for deal",
      dealId,
      "artisan",
      id,
      ":",
      dealCheck.rows
    );
    if (dealCheck.rows.length === 0) {
      console.error(
        "server.js: Deal not found or does not belong to artisan:",
        dealId,
        id
      );
      return res
        .status(404)
        .json({ error: "Deal not found or does not belong to artisan" });
    }
    const result = await pool.query(
      `INSERT INTO job_postings (artisan_id, deal_id, description, image, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [parseInt(id), parseInt(dealId), description, image]
    );
    console.log("server.js: Job posting added:", result.rows[0]);
    res
      .status(200)
      .json({ message: "Job posting added successfully", jobPosting: result.rows[0] });
  } catch (err) {
    console.error("Error adding job posting:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});
app.post("/signup", async (req, res) => {
  const { email, firstName, lastName, password, step } = req.body;
  console.log("server.js: POST /signup", { email, firstName, lastName, step });
  

  if (!email || !firstName || !lastName || !password) {
    console.error("server.js: Missing required fields:", { email, firstName, lastName });
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    if (step === "verify") {
      const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        console.error("server.js: Email already exists:", email);
        return res.status(400).json({ error: "Email already exists" });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      req.session.signupData = { email: email.toLowerCase(), firstName, lastName, password, verificationCode };
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("server.js: Failed to save session:", err.message, err.stack);
            return reject(err);
          }
          console.log("server.js: Session saved successfully, Session ID:", req.sessionID, "Data:", req.session.signupData);
          resolve();
        });
      });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        secure: true,
        port: 587,
        tls: { rejectUnauthorized: false },
      });

      const mailOptions = {
        from: `"The Guild Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your The Guild Account Verification",
        text: `Hello ${firstName},\n\nThank you for signing up! Your verification code is ${verificationCode}. Please enter it on the signup page to complete your registration.\n\nBest,\nThe Guild Team`,
      };

      await transporter.sendMail(mailOptions);
      console.log("server.js: Verification email sent to:", email);

      return res.json({ message: "A verification code has been sent to your email." });
    }

    return res.status(400).json({ error: "Invalid step" });
  } catch (err) {
    console.error("Database or email error:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  console.log("server.js: POST /signin", { email });

  // Input validation
  if (!email || !password) {
    console.error("server.js: Missing email or password");
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Query user with verification status
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()] // Case-insensitive email
    );
    console.log("server.js: User check:", result.rows.length);

    if (result.rows.length === 0) {
      console.error("server.js: Invalid email:", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    if (user.is_banned) {
      console.error("server.js: User is banned:", email);
      return res.status(403).json({ error: "Account is banned" });
    }
    if (!user.verified) {
      console.error("server.js: Email not verified:", email);
      return res.status(401).json({ error: "Email not verified. Please check your email." });
    }

    // Password verification
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.error("server.js: Invalid password for email:", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Set session
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error("server.js: Error saving session:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      console.log("server.js: Login successful for user:", user.id, "Session ID:", req.sessionID);
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          artisanId: user.artisanid,
          role: user.role,
        },
      });
    });

  } catch (err) {
    console.error("Sign-in error:", err.message);
    res.status(500).json({ error: "Internal server error" }); // Avoid stack trace in production
  }
});

// Optional: Add rate limiting (example with express-rate-limit)
const rateLimit = require("express-rate-limit");
app.use(
  "/signin",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: "Too many login attempts, please try again later." },
  })
);
app.post("/verify", async (req, res) => {
  const { email, verificationCode } = req.body;
  console.log("server.js: POST /verify", { email, verificationCode });

  if (!email || !verificationCode) {
    console.error("server.js: Missing email or verification code");
    return res.status(400).json({ error: "Email and verification code are required" });
  }

  try {
    console.log("server.js: POST /verify, Session ID:", req.sessionID, "Session data:", req.session.signupData);
    if (!req.session.signupData || req.session.signupData.email !== email.toLowerCase()) {
      console.error("server.js: No valid signup data in session for email:", email, "Session data:", req.session.signupData);
      return res.status(400).json({ error: "Invalid or expired session data. Please restart the signup process." });
    }

    if (req.session.signupData.verificationCode !== verificationCode) {
      console.error("server.js: Invalid verification code for email:", email);
      return res.status(400).json({ error: "Invalid verification code" });
    }

    const hashedPassword = await bcrypt.hash(req.session.signupData.password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, first_name, last_name, password, verified, role, created_at)
       VALUES ($1, $2, $3, $4, true, 'user', CURRENT_TIMESTAMP)
       RETURNING id, email, first_name, last_name, role, artisanid`,
      [
        req.session.signupData.email,
        req.session.signupData.firstName,
        req.session.signupData.lastName,
        hashedPassword,
      ]
    );

    req.session.userId = result.rows[0].id;
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error("server.js: Failed to save session:", err.message, err.stack);
          return reject(err);
        }
        console.log("server.js: Session saved for user:", result.rows[0].id);
        resolve();
      });
    });

    delete req.session.signupData;
    res.json({ message: "Verification successful", user: result.rows[0] });
  } catch (err) {
    console.error("Verification error:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  console.log("server.js: GET /users/", id);
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, artisanid, role FROM users WHERE id = $1`,
      [parseInt(id)]
    );
    console.log("server.js: User fetch:", result.rows);
    if (result.rows.length === 0) {
      console.error("server.js: User not found:", id);
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.get("/users/by-artisan/:artisanId", async (req, res) => {
  const { artisanId } = req.params;
  console.log("server.js: GET /users/by-artisan/", artisanId);
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name FROM users WHERE artisanid = $1`,
      [parseInt(artisanId)]
    );
    console.log("server.js: User by artisan fetch:", result.rows);
    if (result.rows.length === 0) {
      console.error("server.js: No user linked to artisan:", artisanId);
      return res.status(404).json({ error: "No user linked to this artisan" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user by artisan:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.put("/link-artisan-to-user", async (req, res) => {
  const { userId, artisanId } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE users SET artisanid = $1 WHERE id = $2 RETURNING *`,
      [parseInt(artisanId), parseInt(userId)]
    );

    if (result.rows.length > 0) {
      // CRITICAL: Update the session with the new artisanId
      req.session.userId = result.rows[0].id; 
      
      // Save the session to the database before responding
      req.session.save((err) => {
        if (err) console.error("Session save error:", err);
        res.status(200).json({
          message: "User linked to artisan successfully",
          user: result.rows[0],
        });
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/register-artisan", upload.any(), async (req, res) => {
  const {
    firstname,
    lastname,
    phone,
    gender,
    dob,
    city,
    address,
    skill,
    experience,
    bio,
    reference,
    email,
    userId,
  } = req.body;
  console.log("server.js: POST /register-artisan", {
    firstname,
    lastname,
    email,
    userId,
  });
  try {
    let profilePic = null;
    let certificate = null;
    const portfolio = [];
    req.files.forEach((file) => {
      if (file.fieldname === "profilePic") profilePic = file.filename;
      else if (file.fieldname === "certificate") certificate = file.filename;
      else if (file.fieldname.startsWith("portfolio_"))
        portfolio.push(file.filename);
    });
    if (
      !firstname ||
      !lastname ||
      !phone ||
      !email ||
      !gender ||
      !dob ||
      !city ||
      !address ||
      !skill ||
      !experience ||
      !bio
    ) {
      console.error("server.js: Missing required fields:", req.body);
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await pool.query(
      `INSERT INTO artisans 
       (firstname, lastname, phone, gender, dob, city, address, skill, experience, bio, profile_pic, certificate, reference, email, portfolio, coins)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 50)
       RETURNING *`,
      [
        firstname,
        lastname,
        phone,
        gender,
        dob,
        city,
        address,
        skill,
        experience,
        bio,
        profilePic,
        certificate,
        reference,
        email,
        portfolio.length > 0 ? JSON.stringify(portfolio) : null,
      ]
    );
    const artisan = result.rows[0];

    if (userId) {
      const userCheck = await pool.query(
        `SELECT id FROM users WHERE id = $1`,
        [parseInt(userId)]
      );
      if (userCheck.rows.length === 0) {
        console.error("server.js: User not found for ID:", userId);
        return res.status(404).json({ error: "User not found" });
      }
      await pool.query(
        `UPDATE users SET artisanid = $1 WHERE id = $2`,
        [artisan.id, parseInt(userId)]
      );
      console.log("server.js: Artisan linked to user:", userId);
    }

    console.log("server.js: Artisan registered:", artisan.id);
    res.status(200).json({ message: "Registration successful", data: artisan });
  } catch (err) {
    console.error("Registration failed:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// server.js
app.get("/artisan/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // We JOIN with the users table to get the actual user_id of the artisan
    const result = await pool.query(
      `SELECT a.*, u.id as user_id 
       FROM artisans a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = $1`, 
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/artisan/:id/reviews", async (req, res) => {
  const { id } = req.params;
  console.log("server.js: GET /artisan/", id, "/reviews");
  if (!id || isNaN(parseInt(id))) {
    console.error("server.js: Invalid artisan ID for reviews:", id);
    return res.status(400).json({ error: "Invalid artisan ID" });
  }
  try {
    const result = await pool.query(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.artisan_id = $1
       ORDER BY r.created_at DESC`,
      [parseInt(id)]
    );
    console.log("server.js: Reviews for artisan", id, ":", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("server.js: Error fetching reviews:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.put("/artisan/:id", upload.any(), async (req, res) => {
  const { id } = req.params;
  
  console.log("--- START UPDATE PROCESS ---");
  console.log("Artisan ID:", id);
  console.log("Files received:", req.files?.map(f => ({ field: f.fieldname, name: f.filename })));

  try {
    // 1. Extract non-file data from req.body
    const {
      firstname, lastname, phone, email, gender, dob,
      city, address, skill, experience, bio, reference,
      existingPortfolio // This comes as a JSON string from the frontend
    } = req.body;

    // 2. Initialize file variables
    let profilePic = null;
    let certificate = null;
    
    // Initialize portfolio with existing files (if any)
    let portfolioArray = [];
    try {
      portfolioArray = existingPortfolio ? JSON.parse(existingPortfolio) : [];
    } catch (e) {
      console.error("Error parsing existingPortfolio:", e);
      portfolioArray = [];
    }

    // 3. Process incoming files from Multer
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        // MATCHING FRONTEND NAMES: profilePic, certificate, portfolio
        if (file.fieldname === "profilePic") {
          profilePic = file.filename;
        } else if (file.fieldname === "certificate") {
          certificate = file.filename;
        } else if (file.fieldname === "portfolio") {
          portfolioArray.push(file.filename);
        }
      });
    }

    // 4. Update the Database
    const query = `
      UPDATE artisans 
      SET 
        firstname = $1, 
        lastname = $2, 
        phone = $3, 
        email = $4, 
        gender = $5, 
        dob = $6, 
        city = $7, 
        address = $8, 
        skill = $9, 
        experience = $10, 
        bio = $11, 
        profile_pic = COALESCE($12, profile_pic), 
        certificate = COALESCE($13, certificate), 
        reference = $14, 
        portfolio = $15
      WHERE id = $16
      RETURNING *`;

    const values = [
      firstname,
      lastname,
      phone,
      email,
      gender,
      dob,
      city,
      address,
      skill,
      experience,
      bio,
      profilePic,       // Will be null if no new file, COALESCE handles keeping old pic
      certificate,      // Will be null if no new file, COALESCE handles keeping old cert
      reference,
      JSON.stringify(portfolioArray), // Store as JSON string in DB
      parseInt(id)
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Artisan record not found" });
    }

    console.log("Update Successful for Artisan:", id);
    
    // 5. Send back the updated data
    res.status(200).json({ 
      message: "Profile updated successfully", 
      data: result.rows[0] 
    });

  } catch (err) {
    console.error("Critical Error in PUT /artisan/:id:", err.message);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/artisans", async (req, res) => {
  const { artisan, city } = req.query;
  console.log("server.js: GET /artisans", { artisan, city });
  try {
    const result = await pool.query(
      `SELECT * FROM artisans WHERE LOWER(skill) = LOWER($1) AND LOWER(city) = LOWER($2)`,
      [artisan, city]
    );
    console.log("server.js: Artisans fetched:", result.rows.length);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching artisans:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.get("/artisan/:id/coins", async (req, res) => {
  const { id } = req.params;
  console.log("server.js: GET /artisan/", id, "/coins");
  try {
    const result = await pool.query(
      `SELECT coins FROM artisans WHERE id = $1`,
      [parseInt(id)]
    );
    console.log("server.js: Coins fetch for artisan", id, ":", result.rows);
    if (result.rows.length === 0) {
      console.error("server.js: Artisan not found:", id);
      return res.status(404).json({ error: "Artisan not found" });
    }
    res.status(200).json({ coins: result.rows[0].coins });
  } catch (err) {
    console.error("Error fetching coins:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.post("/artisan/:id/purchase-coins", async (req, res) => {
  const { id } = req.params;
  const { amount, email, coin_amount } = req.body;
  console.log("server.js: POST /artisan/", id, "/purchase-coins", {
    amount,
    email,
    coin_amount,
  });
  if (!id || !amount || amount <= 0 || !coin_amount || coin_amount <= 0 || !email) {
    console.error(
      "server.js: Invalid coin amount, email, or missing fields:",
      req.body
    );
    return res
      .status(400)
      .json({ error: "Invalid coin amount, email, or missing fields" });
  }
  try {
    const artisanResult = await pool.query(
      `SELECT email FROM artisans WHERE id = $1`,
      [parseInt(id)]
    );
    console.log(
      "server.js: Artisan email check for ID",
      id,
      ":",
      artisanResult.rows
    );
    if (artisanResult.rows.length === 0) {
      console.error("server.js: Artisan not found:", id);
      return res.status(404).json({ error: "Artisan not found" });
    }
    if (artisanResult.rows[0].email !== email) {
      console.error("server.js: Email mismatch for artisan", id, ":", email);
      return res
        .status(400)
        .json({ error: "Email does not match artisan record" });
    }
    const transaction = await paystack.transaction.initialize({
      email,
      amount: amount * 100,
      callback_url: `http://localhost:5173/purchase-coins/success`,
      metadata: { artisan_id: parseInt(id), coin_amount },
    });
    console.log(
      "server.js: Transaction initialized for artisan",
      id,
      ":",
      transaction.data.reference
    );
    await pool.query(
      `INSERT INTO coin_transactions (artisan_id, coin_amount, amount, reference, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)`,
      [parseInt(id), coin_amount, amount * 100, transaction.data.reference]
    );
    res.status(200).json({
      message: "Transaction initialized",
      authorization_url: transaction.data.authorization_url,
      reference: transaction.data.reference,
    });
  } catch (err) {
    console.error("Error initializing transaction:", err.message, err.stack);
    res.status(500).json({ error: "Failed to initialize transaction: " + err.message });
  }
});

app.post("/artisan/verify-payment", async (req, res) => {
  const { reference, artisan_id, coin_amount } = req.body;
  console.log("server.js: POST /artisan/verify-payment", {
    reference,
    artisan_id,
    coin_amount,
  });
  if (!reference || !artisan_id || !coin_amount || coin_amount <= 0) {
    console.error("server.js: Missing or invalid required fields:", req.body);
    return res.status(400).json({ error: "Missing or invalid required fields" });
  }
  try {
    const verification = await paystack.transaction.verify({ reference });
    console.log("server.js: Transaction verification:", verification.data.status);
    if (verification.data.status !== "success") {
      console.error("server.js: Transaction not successful:", reference);
      await pool.query(
        `UPDATE coin_transactions SET status = 'failed' WHERE reference = $1`,
        [reference]
      );
      return res.status(400).json({ error: "Transaction not successful" });
    }
    const expectedAmount = coin_amount * 10 * 100;
    if (verification.data.amount !== expectedAmount) {
      console.error(
        "server.js: Transaction amount mismatch:",
        verification.data.amount,
        expectedAmount
      );
      await pool.query(
        `UPDATE coin_transactions SET status = 'failed' WHERE reference = $1`,
        [reference]
      );
      return res.status(400).json({ error: "Transaction amount mismatch" });
    }
    const artisanResult = await pool.query(
      `SELECT id FROM artisans WHERE id = $1`,
      [parseInt(artisan_id)]
    );
    console.log(
      "server.js: Artisan check for ID",
      artisan_id,
      ":",
      artisanResult.rows
    );
    if (artisanResult.rows.length === 0) {
      console.error("server.js: Artisan not found:", artisan_id);
      await pool.query(
        `UPDATE coin_transactions SET status = 'failed' WHERE reference = $1`,
        [reference]
      );
      return res.status(404).json({ error: "Artisan not found" });
    }
    const updateResult = await pool.query(
      `UPDATE artisans SET coins = coins + $1 WHERE id = $2 RETURNING coins`,
      [coin_amount, parseInt(artisan_id)]
    );
    await pool.query(
      `UPDATE coin_transactions SET status = 'success' WHERE reference = $1`,
      [reference]
    );
    console.log(
      "server.js: Coins updated for artisan",
      artisan_id,
      ":",
      updateResult.rows[0].coins
    );
    res.status(200).json({
      message: "Coins purchased successfully",
      coins: updateResult.rows[0].coins,
    });
  } catch (err) {
    console.error("Error verifying transaction:", err.message, err.stack);
    await pool.query(
      `UPDATE coin_transactions SET status = 'failed' WHERE reference = $1`,
      [reference]
    );
    res.status(500).json({ error: "Failed to verify transaction: " + err.message });
  }
});

// Deal-related endpoints
app.post("/confirm-deal", async (req, res) => {
  const { artisanId, userId } = req.body;
  console.log("server.js: POST /confirm-deal", { artisanId, userId });
  if (!artisanId || !userId) {
    console.error("server.js: Missing artisanId or userId:", {
      artisanId,
      userId,
    });
    return res.status(400).json({ error: "Missing artisanId or userId" });
  }
  try {
    const artisanCheck = await pool.query(
      `SELECT id FROM artisans WHERE id = $1`,
      [parseInt(artisanId)]
    );
    console.log(
      "server.js: Artisan check for ID",
      artisanId,
      ":",
      artisanCheck.rows
    );
    if (artisanCheck.rows.length === 0) {
      console.error("server.js: Artisan not found:", artisanId);
      return res.status(404).json({ error: "Artisan not found" });
    }
    const userCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [parseInt(userId)]
    );
    console.log("server.js: User check for ID", userId, ":", userCheck.rows);
    if (userCheck.rows.length === 0) {
      console.error("server.js: User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }
    const result = await pool.query(
      `INSERT INTO deals (user_id, artisan_id, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING *`,
      [parseInt(userId), parseInt(artisanId)]
    );
    console.log("server.js: Deal confirmed:", result.rows[0]);
    res
      .status(200)
      .json({ message: "Deal confirmed successfully", deal: result.rows[0] });
  } catch (err) {
    console.error("Error confirming deal:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Review-related endpoints
app.post("/reviews", async (req, res) => {
  const { artisanId, rating, comment, dealId, userId } = req.body;
  console.log("server.js: POST /reviews", {
    artisanId,
    rating,
    comment,
    dealId,
    userId,
  });
  if (
    !artisanId ||
    !rating ||
    !comment ||
    !dealId ||
    !userId ||
    rating < 1 ||
    rating > 5
  ) {
    console.error("server.js: Invalid review data:", {
      artisanId,
      rating,
      comment,
      dealId,
      userId,
    });
    return res.status(400).json({ error: "Missing or invalid required fields" });
  }
  try {
    const dealCheck = await pool.query(
      `SELECT id, user_id FROM deals WHERE id = $1 AND artisan_id = $2`,
      [parseInt(dealId), parseInt(artisanId)]
    );
    console.log(
      "server.js: Deal check for deal",
      dealId,
      "artisan",
      artisanId,
      ":",
      dealCheck.rows
    );
    if (dealCheck.rows.length === 0) {
      console.error(
        "server.js: Deal not found for ID:",
        dealId,
        "Artisan:",
        artisanId
      );
      return res
        .status(404)
        .json({ error: "Deal not found or does not belong to artisan" });
    }
    if (dealCheck.rows[0].user_id !== parseInt(userId)) {
      console.error("server.js: User not authorized for deal:", userId, dealId);
      return res
        .status(403)
        .json({ error: "Not authorized to review this deal" });
    }
    const jobPostingCheck = await pool.query(
      `SELECT id FROM job_postings WHERE deal_id = $1 AND artisan_id = $2`,
      [parseInt(dealId), parseInt(artisanId)]
    );
    console.log(
      "server.js: Job posting check for deal",
      dealId,
      "artisan",
      artisanId,
      ":",
      jobPostingCheck.rows
    );
    if (jobPostingCheck.rows.length === 0) {
      console.error(
        "server.js: No job posting for deal:",
        dealId,
        "Artisan:",
        artisanId
      );
      return res
        .status(403)
        .json({ error: "Cannot review until artisan uploads job details" });
    }
    const result = await pool.query(
      `INSERT INTO reviews (artisan_id, user_id, deal_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [parseInt(artisanId), parseInt(userId), parseInt(dealId), rating, comment]
    );
    console.log(
      "server.js: Review submitted for artisan",
      artisanId,
      ":",
      result.rows[0]
    );
    res
      .status(200)
      .json({ message: "Review submitted successfully", review: result.rows[0] });
  } catch (err) {
    console.error("server.js: Error submitting review:", err.message, err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Admin endpoints
app.get("/api/admin/users", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) as total FROM users`);
    console.log("server.js: Total users fetched:", result.rows[0].total);
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (err) {
    console.error("server.js: Error fetching total users:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/artisans", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) as total FROM artisans`);
    console.log("server.js: Total artisans fetched:", result.rows[0].total);
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (err) {
    console.error("server.js: Error fetching total artisans:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/stats", ensureAdmin, async (req, res) => {
  try {
    const ratingResult = await pool.query(
      `SELECT AVG(rating)::numeric(3,1) as average_rating FROM reviews`
    );
    const jobPostingsResult = await pool.query(
      `SELECT COUNT(*) as total FROM job_postings`
    );
    console.log(
      "server.js: Stats fetched - avg rating:",
      ratingResult.rows[0].average_rating,
      "job postings:",
      jobPostingsResult.rows[0].total
    );
    res.json({
      averageRating: parseFloat(ratingResult.rows[0].average_rating) || 0,
      totalJobPostings: parseInt(jobPostingsResult.rows[0].total) || 0,
    });
  } catch (err) {
    console.error("server.js: Error fetching stats:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/coin-purchases", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ct.id, ct.artisan_id, ct.coin_amount, ct.amount, ct.created_at,
              a.firstname, a.lastname
       FROM coin_transactions ct
       JOIN artisans a ON a.id = ct.artisan_id
       WHERE ct.status = 'success'
       ORDER BY ct.created_at DESC
       LIMIT 50`
    );
    console.log(
      "server.js: Coin purchases fetched:",
      result.rows.length
    );
    res.json(result.rows);
  } catch (err) {
    console.error("server.js: Error fetching coin purchases:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/deals", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.user_id, d.artisan_id, d.created_at,
              u.first_name as user_first_name, u.last_name as user_last_name,
              a.firstname as artisan_firstname, a.lastname as artisan_lastname,
              25 as coins_deducted
       FROM deals d
       JOIN users u ON u.id = d.user_id
       JOIN artisans a ON a.id = d.artisan_id
       ORDER BY d.created_at DESC
       LIMIT 50`
    );
    console.log("server.js: Deals fetched:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("server.js: Error fetching deals:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/messages", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.timestamp,
              s.first_name as sender_first_name, s.last_name as sender_last_name,
              s.role as sender_role,
              r.first_name as receiver_first_name, r.last_name as receiver_last_name,
              r.role as receiver_role
       FROM messages m
       JOIN users s ON s.id = m.sender_id
       JOIN users r ON r.id = m.receiver_id
       ORDER BY m.timestamp DESC
       LIMIT 50`
    );
    console.log("server.js: Messages fetched:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("server.js: Error fetching messages:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/recent-signups", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 50`
    );
    console.log("server.js: Recent signups fetched:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("server.js: Error fetching recent signups:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/auth/check-session", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No active session" });
  }

  try {
    // We query the DB every time so the artisanId is always fresh
    const userResult = await pool.query(
      "SELECT id, email, first_name, last_name, artisanid, role FROM users WHERE id = $1",
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    
    // Return the fresh data to the frontend
    res.json({
      id: user.id,
      email: user.email,
      username: user.first_name, // Or however you display the name
      artisanId: user.artisanid,  // If this is null in DB, it will be null here
      role: user.role
    });
  } catch (err) {
    console.error("Session Check Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("server.js: Error destroying session:", err);
      return res.status(500).json({ error: "Failed to log out" });
    }
    console.log("server.js: Session destroyed");
    res.json({ message: "Logged out successfully" });
  });
});

app.patch("/artisan/:id/update-coins", async (req, res) => {
  const { id } = req.params;
  const { coins } = req.body;
  if (typeof coins !== "number" || coins < 0) {
    console.error("server.js: Invalid coin amount:", coins);
    return res.status(400).json({ error: "Invalid coin amount" });
  }
  try {
    const result = await pool.query(
      `UPDATE artisans SET coins = $1 WHERE id = $2 RETURNING coins`,
      [coins, parseInt(id)]
    );
    if (result.rows.length === 0) {
      console.error("server.js: Artisan not found:", id);
      return res.status(404).json({ error: "Artisan not found" });
    }
    console.log("server.js: Coins updated for artisan", id, ":", result.rows[0].coins);
    res.json({ coins: result.rows[0].coins });
  } catch (err) {
    console.error("server.js: Error updating coins:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/users", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) as total FROM users`);
    console.log("server.js: Total users fetched:", result.rows[0].total);
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (err) {
    console.error("server.js: Error fetching total users:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/artisans", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) as total FROM artisans`);
    console.log("server.js: Total artisans fetched:", result.rows[0].total);
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (err) {
    console.error("server.js: Error fetching total artisans:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/stats", ensureAdmin, async (req, res) => {
  try {
    const ratingResult = await pool.query(
      `SELECT AVG(rating)::numeric(3,1) as average_rating FROM reviews`
    );
    const jobPostingsResult = await pool.query(
      `SELECT COUNT(*) as total FROM job_postings`
    );
    console.log(
      "server.js: Stats fetched - avg rating:",
      ratingResult.rows[0].average_rating,
      "job postings:",
      jobPostingsResult.rows[0].total
    );
    res.json({
      averageRating: parseFloat(ratingResult.rows[0].average_rating) || 0,
      totalJobPostings: parseInt(jobPostingsResult.rows[0].total) || 0,
    });
  } catch (err) {
    console.error("server.js: Error fetching stats:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/coin-purchases", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ct.id, ct.artisan_id, ct.coin_amount, ct.amount, ct.created_at,
              a.firstname, a.lastname
       FROM coin_transactions ct
       JOIN artisans a ON a.id = ct.artisan_id
       WHERE ct.status = 'success'
       ORDER BY ct.created_at DESC
       LIMIT 50`
    );
    console.log(
      "server.js: Coin purchases fetched:",
      result.rows.length
    );
    res.json(result.rows);
  } catch (err) {
    console.error("server.js: Error fetching coin purchases:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/deals", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.user_id, d.artisan_id, d.created_at,
              u.first_name as user_first_name, u.last_name as user_last_name,
              a.firstname as artisan_firstname, a.lastname as artisan_lastname,
              25 as coins_deducted
       FROM deals d
       JOIN users u ON u.id = d.user_id
       JOIN artisans a ON a.id = d.artisan_id
       ORDER BY d.created_at DESC
       LIMIT 50`
    );
    console.log("server.js: Deals fetched:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("server.js: Error fetching deals:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/messages", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.timestamp,
              s.first_name as sender_first_name, s.last_name as sender_last_name,
              s.role as sender_role,
              r.first_name as receiver_first_name, r.last_name as receiver_last_name,
              r.role as receiver_role
       FROM messages m
       JOIN users s ON s.id = m.sender_id
       JOIN users r ON r.id = m.receiver_id
       ORDER BY m.timestamp DESC
       LIMIT 50`
    );
    console.log("server.js: Messages fetched:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("server.js: Error fetching messages:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/recent-signups", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 50`
    );
    console.log("server.js: Recent signups fetched:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("server.js: Error fetching recent signups:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/users/:id/ban", ensureAdmin, async (req, res) => {
  const { id } = req.params;
  console.log("server.js: POST /api/admin/users/", id, "/ban");
  if (!id || isNaN(parseInt(id))) {
    console.error("server.js: Invalid user ID:", id);
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    const userCheck = await pool.query(
      `SELECT id, is_banned FROM users WHERE id = $1`,
      [parseInt(id)]
    );
    console.log("server.js: User check for ID", id, ":", userCheck.rows);
    if (userCheck.rows.length === 0) {
      console.error("server.js: User not found:", id);
      return res.status(404).json({ error: "User not found" });
    }
    if (userCheck.rows[0].is_banned) {
      console.error("server.js: User already banned:", id);
      return res.status(400).json({ error: "User is already banned" });
    }
    await pool.query(
      `UPDATE users SET is_banned = true WHERE id = $1`,
      [parseInt(id)]
    );
    // Delete all sessions for the banned user
    await pool.query(
      `DELETE FROM session WHERE sess->>'userId' = $1`,
      [id.toString()]
    );
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [req.session.userId, `Banned user ID ${id}`]
    );
    console.log("server.js: User banned, sessions deleted, and audit log created for ID:", id);
    res.status(200).json({ message: "User banned successfully" });
  } catch (err) {
    console.error("server.js: Error banning user:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.put("/api/admin/users/:id", ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role } = req.body;
  console.log("server.js: PUT /api/admin/users/", id, { first_name, last_name, email, role });
  if (!id || isNaN(parseInt(id)) || !first_name || !last_name || !email || !['user', 'artisan', 'admin'].includes(role)) {
    console.error("server.js: Invalid input:", { id, first_name, last_name, email, role });
    return res.status(400).json({ error: "Invalid input" });
  }
  try {
    const userCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [parseInt(id)]
    );
    console.log("server.js: User check for ID", id, ":", userCheck.rows);
    if (userCheck.rows.length === 0) {
      console.error("server.js: User not found:", id);
      return res.status(404).json({ error: "User not found" });
    }
    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, role = $4
       WHERE id = $5
       RETURNING id, first_name, last_name, email, role`,
      [first_name, last_name, email, role, parseInt(id)]
    );
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [req.session.userId, `Updated user ID ${id}`]
    );
    console.log("server.js: User updated and audit log created for ID:", id);
    res.status(200).json({ message: "User updated successfully", user: result.rows[0] });
  } catch (err) {
    console.error("server.js: Error updating user:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});
app.get("/api/admin/signup-trends", ensureAdmin, async (req, res) => {
  const { range, role } = req.query;
  console.log("server.js: GET /api/admin/signup-trends", { range, role });
  if (!['7d', '30d', '90d'].includes(range)) {
    console.error("server.js: Invalid range parameter:", range);
    return res.status(400).json({ error: "Invalid range parameter" });
  }
  if (role && !['user', 'artisan', 'admin', 'all'].includes(role)) {
    console.error("server.js: Invalid role parameter:", role);
    return res.status(400).json({ error: "Invalid role parameter" });
  }
  try {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999); // End of today in UTC
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0); // Start of day in UTC
    console.log("server.js: Date range:", startDate.toISOString(), "to", endDate.toISOString());
    const query = role && role !== 'all'
      ? `SELECT TO_CHAR(created_at AT TIME ZONE 'WAT', 'YYYY-MM-DD') as date, COUNT(*) as count
         FROM users
         WHERE created_at IS NOT NULL
           AND created_at >= $1
           AND created_at <= $2
           AND role = $3
         GROUP BY TO_CHAR(created_at AT TIME ZONE 'WAT', 'YYYY-MM-DD')
         ORDER BY TO_CHAR(created_at AT TIME ZONE 'WAT', 'YYYY-MM-DD') ASC`
      : `SELECT TO_CHAR(created_at AT TIME ZONE 'WAT', 'YYYY-MM-DD') as date, COUNT(*) as count
         FROM users
         WHERE created_at IS NOT NULL
           AND created_at >= $1
           AND created_at <= $2
         GROUP BY TO_CHAR(created_at AT TIME ZONE 'WAT', 'YYYY-MM-DD')
         ORDER BY TO_CHAR(created_at AT TIME ZONE 'WAT', 'YYYY-MM-DD') ASC`;
    const params = role && role !== 'all' ? [startDate, endDate, role] : [startDate, endDate];
    const result = await pool.query(query, params);
    console.log("server.js: Signup trends fetched:", result.rows);
    const trends = [];
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const signup = result.rows.find((row) => row.date === dateStr);
      trends.push({
        date: dateStr,
        count: signup ? Number(signup.count) : 0,
      });
    }
    console.log("server.js: Trends response:", trends);
    res.status(200).json(trends);
  } catch (err) {
    console.error("server.js: Error fetching signup trends:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.get("/api/admin/audit-logs", ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.id, al.admin_id, al.action, al.created_at,
              u.first_name, u.last_name
       FROM audit_logs al
       JOIN users u ON u.id = al.admin_id
       ORDER BY al.created_at DESC
       LIMIT 50`
    );
    console.log("server.js: Audit logs fetched:", result.rows.length);
    const formattedLogs = result.rows.map((log) => ({
      id: log.id,
      admin: `${log.first_name} ${log.last_name}`,
      action: log.action,
      timestamp: log.created_at,
    }));
    res.status(200).json(formattedLogs);
  } catch (err) {
    console.error("server.js: Error fetching audit logs:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});
// Health check
app.get("/health", (req, res) => {
  console.log("server.js: GET /health");
  res.status(200).json({ status: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message, err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});