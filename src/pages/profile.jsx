import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Profile.css";

const abujaData = {
  cities: [
    "Asokoro", "Maitama", "Wuse", "Garki", "Gwarimpa", "Lokogoma", "Jabi", "Utako", "Katampe Extension Hill",
    "Kuje", "Abaji", "Bwari", "Gwagwalada", "Kwali", "Abuja Municipal Area Council (AMAC)", "Dawaki", "Gwagwa",
    "Nyanya", "Kubwa", "Olu Awotesu Street", "Lugbe", "Guzape", "Apo Dutse", "Dakibiyu", "Duboyi", "Durumi",
    "Gaduwa", "Games Village", "Kaura", "Gudu", "Jahi", "Kado", "Kukwaba", "Mabushi", "Wuye", "Galadimawa",
    "Kabusa", "Karmo", "Life Camp", "Nbora"
  ]
};

function Profile() {
  const { user, login, setArtisanStatus, setArtisan, loading } = useAuth();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    gender: "",
    dob: "",
    city: "",
    address: "",
    skill: "",
    experience: "",
    bio: "",
    reference: "",
  });
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [filteredCities, setFilteredCities] = useState(abujaData.cities);
  const [errorMessages, setErrorMessages] = useState({
    gender: "",
    phone: "",
    city: "",
    general: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const phoneErrorRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading...</span>
      </div>
    );
  }

  if (!user) {
    console.log("Profile.jsx: No user, redirecting to signin");
    navigate("/signin");
    return null;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCityClick = () => {
    setShowCityDropdown(!showCityDropdown);
    setCitySearch("");
    setFilteredCities(abujaData.cities);
  };

  const handleCitySelect = (city) => {
    setFormData((prev) => ({ ...prev, city }));
    setErrorMessages((prev) => ({ ...prev, city: "" }));
    setShowCityDropdown(false);
    setCitySearch("");
  };

  const handleCitySearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setCitySearch(searchTerm);
    setFilteredCities(
      abujaData.cities.filter((city) => city.toLowerCase().includes(searchTerm))
    );
  };

  useEffect(() => {
    if (errorMessages.phone && phoneErrorRef.current) {
      phoneErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errorMessages.phone]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false);
        setCitySearch("");
        setFilteredCities(abujaData.cities);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessages({ gender: "", phone: "", city: "", general: "" });
    setIsSubmitting(true);

    if (!user?.id) {
      setErrorMessages({ ...errorMessages, general: "You must be logged in to register as an artisan." });
      navigate("/signin");
      setIsSubmitting(false);
      return;
    }

    let formErrors = {};
    const phoneRegex = /^(0\d{10}|\+234\d{10})$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      formErrors.phone = "Enter a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)";
    }

    if (!formData.gender) {
      formErrors.gender = "Gender is required";
    }

    if (!formData.city) {
      formErrors.city = "City is required";
    }

    if (Object.keys(formErrors).length > 0) {
      setErrorMessages(formErrors);
      setIsSubmitting(false);
      return;
    }

    const submission = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) submission.append(key, value);
    });
    submission.append("userId", user.id);
    if (profilePic) submission.append("profilePic", profilePic);
    if (certificate) submission.append("certificate", certificate);
    portfolio.forEach((file, index) => {
      submission.append(`portfolio_${index}`, file);
    });

    try {
      console.log("Profile.jsx: Submitting artisan registration for user:", user.id);
      const response = await fetch("http://localhost:8080/register-artisan", {
        method: "POST",
        body: submission,
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Profile.jsx: Registration failed:", data.error);
        throw new Error(data.error || "Registration failed");
      }

      console.log("Profile.jsx: Registration successful:", data);
      setArtisanStatus(true);
      setArtisan(data.data.id);
      const updatedUser = { ...user, artisanId: data.data.id };
      await login(updatedUser);
      setTimeout(() => {
        navigate("/artisan-profile");
      }, 2000);
    } catch (err) {
      console.error("Profile.jsx: Registration error:", err.message);
      setErrorMessages((prev) => ({ ...prev, general: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="artisan-form">
        <h2 className="form-title">Become an Artisan</h2>
        {errorMessages.general && (
          <div className="error-message general-error">{errorMessages.general}</div>
        )}

        <div className="form-group">
          <label htmlFor="firstname">First Name <span className="required">*</span></label>
          <input
            id="firstname"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            className="form-input"
            required
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastname">Last Name <span className="required">*</span></label>
          <input
            id="lastname"
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            className="form-input"
            required
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number <span className="required">*</span></label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="form-input"
            required
            aria-required="true"
            aria-describedby={errorMessages.phone ? "phone-error" : undefined}
          />
          {errorMessages.phone && (
            <div id="phone-error" ref={phoneErrorRef} className="error-message">
              {errorMessages.phone}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email <span className="required">*</span></label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            required
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender <span className="required">*</span></label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="form-select"
            required
            aria-required="true"
            aria-describedby={errorMessages.gender ? "gender-error" : undefined}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errorMessages.gender && (
            <div id="gender-error" className="error-message">
              {errorMessages.gender}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="dob">Date of Birth <span className="required">*</span></label>
          <input
            id="dob"
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            className="form-input"
            required
            max={today}
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">City / Town <span className="required">*</span></label>
          <div className="city-dropdown-wrapper" ref={cityDropdownRef}>
            <input
              id="city"
              type="text"
              name="city"
              value={formData.city}
              onClick={handleCityClick}
              placeholder="Select City"
              className="form-input"
              readOnly
              required
              aria-required="true"
              aria-describedby={errorMessages.city ? "city-error" : undefined}
            />
            {showCityDropdown && (
              <div
                className="city-dropdown"
                style={{
                  maxHeight: '150px',
                  overflowY: 'scroll',
                  border: '1px solid #ccc',
                  marginTop: '0px',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                }}
                onClick={(e) => e.stopPropagation()}
              >
              
                {filteredCities.map((city, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      handleCitySelect(city);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    {city}
                  </div>
                ))}
                {filteredCities.length === 0 && (
                  <div
                    style={{
                      padding: '8px 12px',
                      color: '#666',
                      textAlign: 'center',
                    }}
                  >
                    No cities found
                  </div>
                )}
              </div>
            )}
            </div>
                          
          {errorMessages.city && (
            <div id="city-error" className="error-message">
              {errorMessages.city}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="address">Full Address <span className="required">*</span></label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="form-textarea"
            required
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="skill">Primary Skill / Trade <span className="required">*</span></label>
          <select
            id="skill"
            name="skill"
            value={formData.skill}
            onChange={handleChange}
            className="form-select"
            required
            aria-required="true"
          >
            <option value="">Select Skill</option>
            <option value="Carpenter">Carpenter</option>
            <option value="Electrician">Electrician</option>
            <option value="Plumber">Plumber</option>
            <option value="Welder">Welder</option>
            <option value="Tiler">Tiler</option>
            <option value="Cleaner">Cleaner</option>
            <option value="Painter">Painter</option>
            <option value="Gardener">Gardener</option>
            <option value="Technician">Technician</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="experience">Years of Experience <span className="required">*</span></label>
          <input
            id="experience"
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            min="0"
            className="form-input"
            required
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="bio">Brief Bio / About Me <span className="required">*</span></label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            className="form-textarea"
            required
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="reference">Reference (Optional)</label>
          <input
            id="reference"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="profilePic">Profile Picture (Optional)</label>
          <input
            id="profilePic"
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePic(e.target.files[0])}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="certificate">Certificate or Training Proof (Optional)</label>
          <input
            id="certificate"
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setCertificate(e.target.files[0])}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="portfolio">Portfolio (photos/videos of past work, Optional)</label>
          <input
            id="portfolio"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => setPortfolio(Array.from(e.target.files))}
            className="form-input"
          />
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting && <span className="submit-spinner"></span>}
          {isSubmitting ? "Submitting..." : "Join as Artisan"}
        </button>
      </form>
  );
}

export default Profile;