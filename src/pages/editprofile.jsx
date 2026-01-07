import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function EditProfile() {
  const { user, isArtisan, logout } = useAuth();
  const navigate = useNavigate();
  const artisanId = user?.artisanId;

  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    firstname: "", lastname: "", phone: "", email: "", gender: "",
    dob: "", city: "", address: "", skill: "", experience: "",
    bio: "", reference: "",
  });
  
  const [profilePic, setProfilePic] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [existingPortfolio, setExistingPortfolio] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [newJobPosting, setNewJobPosting] = useState({
    dealId: "", description: "", image: null,
  });

  useEffect(() => {
    const fetchArtisanAndDeals = async () => {
      try {
        const response = await fetch(`http://localhost:8080/artisan/${artisanId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) { logout(); return; }
          throw new Error(`Failed to fetch artisan: ${response.status}`);
        }
        const data = await response.json();
        setFormData({
          firstname: data.firstname || "",
          lastname: data.lastname || "",
          phone: data.phone || "",
          email: data.email || "",
          gender: data.gender || "",
          dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
          city: data.city || "",
          address: data.address || "",
          skill: data.skill || "",
          experience: data.experience || "",
          bio: data.bio || "",
          reference: data.reference || ""
        });
        setExistingPortfolio(data.portfolio || []);
        setDeals(data.deals || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to load profile data.");
        setLoading(false);
      }
    };

    if (!user || !isArtisan) {
      navigate("/profile");
    } else {
      fetchArtisanAndDeals();
    }
  }, [user, isArtisan, artisanId, navigate, logout]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files[0]) return;

    if (name === "profilePic") setProfilePic(files[0]);
    else if (name === "certificate") setCertificate(files[0]);
    else if (name === "portfolio") setPortfolio(Array.from(files));
  };

  // --- Main Profile Update ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const formDataToSend = new FormData();
    
    // Append text fields
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    // Append Files
    if (profilePic) formDataToSend.append("profilePic", profilePic);
    if (certificate) formDataToSend.append("certificate", certificate);
    
    // Multiple files must be appended with the same key name
    portfolio.forEach((file) => {
      formDataToSend.append("portfolio", file);
    });

    try {
      const response = await fetch(`http://localhost:8080/artisan/${artisanId}`, {
        method: "PUT",
        body: formDataToSend,
        credentials: "include",
        // Note: Do NOT set Content-Type header when sending FormData
      });
      if (!response.ok) throw new Error("Failed to update profile");
      navigate("/artisan-profile");
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Job Posting (Exhibit) Update ---
  const handleJobPostingSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const postData = new FormData();
    postData.append("dealId", newJobPosting.dealId);
    postData.append("description", newJobPosting.description);
    if (newJobPosting.image) postData.append("image", newJobPosting.image);

    try {
      const response = await fetch(`http://localhost:8080/artisan/job-posting`, {
        method: "POST",
        body: postData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to publish exhibit");
      window.location.reload(); // Refresh to show new gallery item
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-10 h-10 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Edit Profile</h1>
            <p className="text-amber-600 text-[10px] uppercase tracking-[0.3em] font-bold mt-2">The Guild Registry</p>
          </div>
          <button onClick={() => navigate("/artisan-profile")} className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">Cancel Changes</button>
        </header>

        <div className="flex border-b border-stone-200 mb-8">
          <button onClick={() => setActiveTab('personal')} className={`pb-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${activeTab === 'personal' ? 'text-stone-900 border-b-2 border-amber-600' : 'text-stone-400 border-transparent hover:text-stone-600'}`}>Personal Identity</button>
          <button onClick={() => setActiveTab('showcase')} className={`pb-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${activeTab === 'showcase' ? 'text-stone-900 border-b-2 border-amber-600' : 'text-stone-400 border-transparent hover:text-stone-600'}`}>Portfolio & Showcase</button>
        </div>

        {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs uppercase tracking-widest font-bold">
              {error}
            </div>
          )}

        <form onSubmit={handleSubmit} className="bg-white border border-stone-100 shadow-xl shadow-stone-200/50 p-8 md:p-12">
          
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">First Name *</label>
                <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} className="w-full border-b border-stone-200 py-2 outline-none focus:border-amber-600 transition-all font-serif text-lg" required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">Last Name *</label>
                <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} className="w-full border-b border-stone-200 py-2 outline-none focus:border-amber-600 transition-all font-serif text-lg" required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">Phone *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border-b border-stone-200 py-2 outline-none focus:border-amber-600 transition-all" required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">City/Area *</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border-b border-stone-200 py-2 outline-none focus:border-amber-600 transition-all" required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">Home/Workshop Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border-b border-stone-200 py-2 outline-none focus:border-amber-600 transition-all" required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">The Story of Your Craft (Bio)</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} className="w-full border border-stone-100 p-4 outline-none focus:border-amber-600 transition-all min-h-[120px] font-serif italic text-stone-600" />
              </div>
            </div>
          )}

          {activeTab === 'showcase' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">Profile Portrait</label>
                  <div className="relative group">
                    <input type="file" name="profilePic" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="border-2 border-dashed border-stone-200 p-8 text-center text-[10px] uppercase tracking-widest text-stone-400 group-hover:border-amber-500 group-hover:text-amber-600 transition-all">
                      {profilePic ? `Selected: ${profilePic.name}` : "Click to Update Portrait"}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">Add Portfolio Works</label>
                  <div className="relative group">
                    <input type="file" name="portfolio" multiple accept="image/*,video/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="border-2 border-dashed border-stone-200 p-8 text-center text-[10px] uppercase tracking-widest text-stone-400 group-hover:border-stone-900 group-hover:text-stone-900 transition-all">
                      {portfolio.length > 0 ? `${portfolio.length} files selected` : "Select Project Media"}
                    </div>
                  </div>
                </div>
              </div>

              {existingPortfolio.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-900 mb-6">Current Gallery</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {existingPortfolio.map((file, index) => (
                      <div key={index} className="aspect-square bg-stone-100 relative group overflow-hidden">
                        {file.endsWith(".mp4") ? (
                          <div className="w-full h-full flex items-center justify-center text-stone-400 text-[8px]">VIDEO</div>
                        ) : (
                          <img src={`http://localhost:8080/uploads/${file}`} alt="Portfolio" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-stone-50 flex justify-end">
            <button type="submit" className="px-12 py-4 bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-amber-700 transition-all shadow-lg">
              Seal Changes
            </button>
          </div>
        </form>

        {deals.length > 0 && deals.some(d => !d.job_posting) && (
          <div className="mt-16 bg-stone-900 p-12 text-white">
            <div className="mb-8">
                <h3 className="text-2xl font-serif mb-2">Exhibit Completed Works</h3>
                <p className="text-amber-500 text-[9px] uppercase tracking-[0.2em] font-bold">Update your showcase based on recent contracts</p>
            </div>
            
            <form onSubmit={handleJobPostingSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">Select Recent Deal</label>
                <select 
                    value={newJobPosting.dealId} 
                    onChange={(e) => setNewJobPosting({ ...newJobPosting, dealId: e.target.value })}
                    className="w-full bg-transparent border-b border-stone-700 py-3 outline-none focus:border-amber-500 transition-all text-sm"
                    required
                >
                    <option value="" className="text-stone-900">Choose a contract</option>
                    {deals.filter(d => !d.job_posting).map(d => (
                        <option key={d.id} value={d.id} className="text-stone-900">Work for {d.first_name}</option>
                    ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">Exhibit Image</label>
                <input 
                    type="file" 
                    onChange={(e) => setNewJobPosting({ ...newJobPosting, image: e.target.files[0] })}
                    className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-stone-800 file:text-white hover:file:bg-amber-600"
                    required
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">Project Summary</label>
                <textarea 
                    value={newJobPosting.description}
                    onChange={(e) => setNewJobPosting({ ...newJobPosting, description: e.target.value })}
                    className="w-full bg-stone-800/50 border border-stone-700 p-4 outline-none focus:border-amber-500 transition-all min-h-[100px] text-sm"
                    placeholder="Describe the mastery applied in this project..."
                    required
                />
              </div>

              <button type="submit" className="md:col-span-2 py-4 border-2 border-amber-600 text-amber-600 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-amber-600 hover:text-white transition-all">
                Publish to Gallery
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditProfile;