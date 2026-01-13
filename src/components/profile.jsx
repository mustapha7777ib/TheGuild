import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext.jsx';

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
    firstname: "", lastname: "", phone: "", email: "", gender: "",
    dob: "", city: "", address: "", skill: "", experience: "",
    bio: "", reference: "",
  });
  
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState(abujaData.cities);
  const [errorMessages, setErrorMessages] = useState({ gender: "", phone: "", city: "", general: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- REFS FOR SCROLLING ---
  const phoneRef = useRef(null);
  const genderRef = useRef(null);
  const cityRef = useRef(null);
  const generalErrorRef = useRef(null);
  const cityDropdownRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCityClick = () => { setShowCityDropdown(!showCityDropdown); setFilteredCities(abujaData.cities); };
  const handleCitySelect = (city) => { setFormData((prev) => ({ ...prev, city })); setErrorMessages((prev) => ({ ...prev, city: "" })); setShowCityDropdown(false); };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) setShowCityDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessages({ gender: "", phone: "", city: "", general: "" });
    setIsSubmitting(true);

    if (!user?.id) { navigate("/signin"); return; }

    const phoneRegex = /^(0\d{10}|\+234\d{10})$/;
    let formErrors = {};
    
    // Validation Logic
    if (!formData.phone || !phoneRegex.test(formData.phone)) formErrors.phone = "Invalid Nigerian phone number.";
    if (!formData.gender) formErrors.gender = "Gender is required";
    if (!formData.city) formErrors.city = "City is required";

    if (Object.keys(formErrors).length > 0) {
      setErrorMessages(formErrors);
      setIsSubmitting(false);

      // --- SCROLL TO FIRST ERROR ---
      // We check errors in the order they appear in the UI (Phone -> Gender -> City)
      setTimeout(() => {
        if (formErrors.phone) {
          phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (formErrors.gender) {
          genderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (formErrors.city) {
          cityRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    const submission = new FormData();
    Object.entries(formData).forEach(([key, value]) => { if (value) submission.append(key, value); });
    submission.append("userId", user.id);
    if (profilePic) submission.append("profilePic", profilePic);
    if (certificate) submission.append("certificate", certificate);
    portfolio.forEach((file, index) => submission.append(`portfolio_${index}`, file));

try {
  const response = await fetch("/api/register-artisan", {
    method: "POST",
    body: submission,
    credentials: "include"
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Registration failed");

  setArtisanStatus(true);
  setArtisan(data.data.id);

  await login({
    ...user,
    artisanId: data.data.id
  });

  navigate("/artisan-profile");
} catch (err) {
  setErrorMessages((prev) => ({ ...prev, general: err.message }));
  setTimeout(() => {
    generalErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
} finally {
  setIsSubmitting(false);
}
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
        
        <div className="bg-stone-900 p-8 text-center">
          <h1 className="text-3xl font-serif text-white tracking-tight">Become an Artisan</h1>
          <p className="text-amber-500 text-[10px] uppercase tracking-[0.3em] mt-2 font-bold">The Master Craftsman Enlistment</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-8">
          {errorMessages.general && (
            <div ref={generalErrorRef} className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {errorMessages.general}
            </div>
          )}

          <section className="space-y-6">
            <h3 className="text-stone-900 font-serif text-xl border-b border-stone-100 pb-2">Personal Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">First Name *</label>
                <input name="firstname" value={formData.firstname} onChange={handleChange} className="w-full border-stone-200 border-b focus:border-amber-600 outline-none py-2 transition-all" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Last Name *</label>
                <input name="lastname" value={formData.lastname} onChange={handleChange} className="w-full border-stone-200 border-b focus:border-amber-600 outline-none py-2 transition-all" required />
              </div>

              {/* PHONE INPUT WITH REF */}
              <div className="space-y-2" ref={phoneRef}>
                <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Phone Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border-stone-200 border-b focus:border-amber-600 outline-none py-2 transition-all" required />
                {errorMessages.phone && <p className="text-[10px] text-red-500 uppercase">{errorMessages.phone}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-stone-200 border-b focus:border-amber-600 outline-none py-2 transition-all" required />
              </div>

              {/* GENDER INPUT WITH REF */}
              <div className="space-y-2" ref={genderRef}>
                <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border-stone-200 border-b focus:border-amber-600 outline-none py-2 bg-transparent" required>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errorMessages.gender && <p className="text-[10px] text-red-500 uppercase">{errorMessages.gender}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Date of Birth *</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} max={today} className="w-full border-stone-200 border-b focus:border-amber-600 outline-none py-2" required />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-stone-900 font-serif text-xl border-b border-stone-100 pb-2">Craft & Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CITY INPUT WITH REF */}
              <div className="space-y-2 relative" ref={cityRef}>
                <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">City / Area *</label>
                <div ref={cityDropdownRef}>
                  <input readOnly value={formData.city} onClick={handleCityClick} placeholder="Select Area" className="w-full border-stone-200 border-b focus:border-amber-600 outline-none py-2 cursor-pointer" required />
                  {showCityDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-stone-100 shadow-2xl max-h-48 overflow-y-auto">
                      {filteredCities.map((city, i) => (
                        <div key={i} onClick={() => handleCitySelect(city)} className="px-4 py-2 hover:bg-stone-50 cursor-pointer text-sm text-stone-600">{city}</div>
                      ))}
                    </div>
                  )}
                </div>
                {errorMessages.city && <p className="text-[10px] text-red-500 uppercase">{errorMessages.city}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Trade / Skill *</label>
                <select name="skill" value={formData.skill} onChange={handleChange} className="w-full border-stone-200 border-b focus:border-amber-600 outline-none py-2 bg-transparent" required>
                  <option value="">Select Skill</option>
                  {["Carpenter", "Electrician", "Plumber", "Welder", "Painter", "Technician"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {/* ... rest of the form remains same ... */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Full Workshop/Home Address *</label>
              <textarea name="address" value={formData.address} onChange={handleChange} className="w-full border border-stone-100 p-3 focus:border-amber-600 outline-none min-h-[80px]" required />
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-stone-900 font-serif text-xl border-b border-stone-100 pb-2">Experience & Evidence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Years of Practice *</label>
                <input type="number" name="experience" value={formData.experience} onChange={handleChange} className="w-full border-stone-200 border-b focus:border-amber-600 outline-none py-2" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Profile Portrait</label>
                <input type="file" onChange={(e) => setProfilePic(e.target.files[0])} className="text-xs text-stone-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-amber-700" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">The Story of your Craft (Bio) *</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} className="w-full border border-stone-100 p-3 focus:border-amber-600 outline-none min-h-[120px]" placeholder="Tell us about your journey as an artisan..." required />
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-stone-900 text-white font-bold uppercase tracking-[0.2em] text-sm hover:bg-amber-700 transition-all shadow-lg flex items-center justify-center gap-3 disabled:bg-stone-400"
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
            {isSubmitting ? "Enlisting..." : "Enlist as Artisan"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;