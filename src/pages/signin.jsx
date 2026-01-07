import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function SignIn() {
  const { login, setArtisanId } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setMessage("Please enter both email and password.");
      return;
    }

    fetch("http://localhost:8080/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage(data.error);
        } else {
          setMessage("Login successful!");
          login(data.user);
          setArtisanId(data.user.artisanId);
          navigate("/");
        }
      })
      .catch((err) => setMessage("Error: " + err.message));
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF9F6]">
      {/* Visual Side (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-stone-900 items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1581425946921-037a89270751?q=80&w=1000')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative z-10 text-center p-12">
          <h1 className="text-5xl font-serif text-white mb-4 tracking-tight">The Guild</h1>
          <p className="text-amber-500 uppercase tracking-[0.4em] text-xs font-bold">
            Mastery & Connection
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-serif text-stone-900 tracking-tight">Welcome Back</h2>
            <p className="text-stone-500 mt-2 font-light">Enter the guild to manage your commissions.</p>
          </div>

          {message && (
            <div className={`p-4 text-sm ${message.includes("Error") ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"} border border-current opacity-90`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-amber-500 focus:ring-0 transition-all outline-none text-stone-800 placeholder:text-stone-300 rounded-sm"
                />
              </div>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-amber-500 focus:ring-0 transition-all outline-none text-stone-800 placeholder:text-stone-300 rounded-sm"
                />
              </div>
            </div>

            <p className="text-[11px] text-stone-400 leading-relaxed uppercase tracking-wider">
              By entering, you agree to our <span className="text-stone-800 underline cursor-pointer">Terms of Use</span> and <span className="text-stone-800 underline cursor-pointer">Privacy Policy</span>.
            </p>

            <button 
              type="submit"
              className="w-full py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-xs hover:bg-amber-700 transition-all duration-300 shadow-lg shadow-stone-200"
            >
              Sign In to Account
            </button>

            <p className="text-center text-sm text-stone-500 pt-4">
              New to the Workshop?{" "}
              <Link to="/signup" className="text-amber-700 font-bold hover:text-amber-800 transition-colors">
                Create Account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignIn;