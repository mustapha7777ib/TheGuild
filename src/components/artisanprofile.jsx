import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ArtisanProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const artisanId = user?.artisanId;
  const [artisan, setArtisan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ dealId: "", rating: 0, comment: "" });
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!artisanId) return;
    const fetchData = async () => {
      try {
        const [artRes, revRes] = await Promise.all([
          fetch(`/api/artisan/${artisanId}`, { credentials: "include" }),
          fetch(`/api/artisan/${artisanId}/reviews`, { credentials: "include" })
        ]);
        if (artRes.ok) setArtisan(await artRes.json());
        if (revRes.ok) setReviews(await revRes.json());
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [artisanId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-10 h-10 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
  );

  if (!artisan) return <div className="p-20 text-center font-serif text-stone-500">Profile not found.</div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20">
      {/* Editorial Header */}
      <div className="relative h-64 bg-stone-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20 grayscale bg-[url('https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2000')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-end">
          <div className="relative group">
            <img
              src={`http://localhost:8080/uploads/${artisan.profile_pic}`}
              alt="Profile"
              className="w-48 h-48 object-cover rounded-sm border-4 border-white shadow-2xl bg-stone-100"
              onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
            />
            <div className="absolute top-4 right-4 bg-amber-500 text-stone-900 text-[10px] font-bold px-2 py-1 uppercase tracking-tighter">Verified</div>
          </div>
          
          <div className="flex-1 pb-4 text-center md:text-left ">
            <h1 className="text-4xl md:text-5xl font-serif text-black tracking-tight pt-40">
              {artisan.firstname} {artisan.lastname}
            </h1>
            <p className="text-amber-500 font-bold uppercase tracking-[0.3em] text-xs mt-2">
              Master {artisan.skill}
            </p>
          </div>

          <div className="pb-4">
            <button onClick={() => navigate("/edit-profile")} className="px-6 py-2 border border-white/20 text-white text-xs uppercase tracking-widest hover:bg-white hover:text-stone-900 transition-all bg-black">
              Edit Master Profile
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-16">
          
          {/* Left Column: Details */}
          <div className="space-y-12">
            <div className="bg-white p-8 border border-stone-100 shadow-sm">
              <h3 className="font-serif text-xl mb-6 text-stone-900">The Workshop</h3>
              <div className="space-y-4 text-sm text-stone-600">
                <div className="flex justify-between border-b border-stone-50 pb-2">
                  <span className="font-bold uppercase tracking-tighter text-[10px]">Location</span>
                  <span>{artisan.city}</span>
                </div>
                <div className="flex justify-between border-b border-stone-50 pb-2">
                  <span className="font-bold uppercase tracking-tighter text-[10px]">Experience</span>
                  <span>{artisan.experience} Years</span>
                </div>
                <div className="flex justify-between border-b border-stone-50 pb-2">
                  <span className="font-bold uppercase tracking-tighter text-[10px]">Guild Coins</span>
                  <span className="text-amber-600 font-bold">{artisan.coins}</span>
                </div>
                <div className="pt-4 space-y-2">
                   <p className="text-[10px] uppercase font-bold text-stone-400">Bio</p>
                   <p className="font-serif italic leading-relaxed text-stone-500">"{artisan.bio}"</p>
                </div>
              </div>
            </div>

            {artisan.certificate && (
              <a 
                href={`http://localhost:8080/uploads/${artisan.certificate}`} 
                target="_blank" 
                className="block p-4 border-2 border-dashed border-stone-200 text-center text-xs uppercase tracking-widest text-stone-400 hover:border-amber-500 hover:text-amber-600 transition-all"
              >
                View Professional Credentials
              </a>
            )}
          </div>

          {/* Center/Right Column: Portfolio & Jobs */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* Portfolio Section */}
            <section>
              <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-2">
                <h3 className="font-serif text-2xl text-stone-900">Bespoke Gallery</h3>
                <span className="text-[10px] uppercase tracking-widest text-stone-400">{artisan.portfolio?.length || 0} Projects</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {artisan.portfolio?.map((file, index) => (
                  <div key={index} className="aspect-square bg-stone-200 overflow-hidden group">
                    {file.endsWith(".mp4") ? (
                      <video className="w-full h-full object-cover" controls src={`http://localhost:8080/uploads/${file}`} />
                    ) : (
                      <img className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 hover:scale-110" src={`http://localhost:8080/uploads/${file}`} alt="Work" />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews Section */}
            <section>
              <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-2">
                <h3 className="font-serif text-2xl text-stone-900">Client Testimonials</h3>
                {user && artisan.deals?.some(d => d.user_id === user.id) && (
                  <button onClick={() => setShowReviewModal(true)} className="text-[10px] text-amber-600 font-bold uppercase hover:underline">Write a Review</button>
                )}
              </div>
              
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white p-6 border-l-4 border-amber-500 shadow-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-serif text-lg">{review.first_name}</span>
                      <span className="text-amber-500 text-xs">{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span>
                    </div>
                    <p className="text-stone-500 italic text-sm font-light">"{review.comment}"</p>
                    <p className="text-[9px] uppercase tracking-widest text-stone-400 mt-4">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Modern Modal Overlays (Review Logic remains same as original) */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/90 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300">
             <h3 className="font-serif text-2xl mb-6">Leave a Review</h3>
             <form className="space-y-4" onSubmit={handleReviewSubmit}>
                <select 
                  className="w-full border-b border-stone-200 py-2 outline-none"
                  value={reviewData.dealId}
                  onChange={(e) => setReviewData({...reviewData, dealId: e.target.value})}
                >
                  <option value="">Select Project</option>
                  {artisan.deals?.filter(d => d.user_id === user.id).map(d => (
                    <option key={d.id} value={d.id}>Project with {d.first_name}</option>
                  ))}
                </select>
                <input 
                  type="number" min="1" max="5" placeholder="Rating (1-5)"
                  className="w-full border-b border-stone-200 py-2 outline-none"
                  onChange={(e) => setReviewData({...reviewData, rating: Number(e.target.value)})}
                />
                <textarea 
                  placeholder="Your experience..."
                  className="w-full border-b border-stone-200 py-2 outline-none h-24"
                  onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                />
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-3 bg-stone-900 text-white text-xs uppercase tracking-widest font-bold">Submit</button>
                  <button type="button" onClick={() => setShowReviewModal(false)} className="flex-1 py-3 border border-stone-200 text-xs uppercase tracking-widest font-bold">Cancel</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArtisanProfile;