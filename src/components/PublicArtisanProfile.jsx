import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext.jsx';

function PublicArtisanProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtisan = async () => {
      try {
        const response = await fetch(`/api/artisan/${id}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch artisan");
        const data = await response.json();
        setArtisan(data);

        if (user) {
          const eligibleDeal = data.deals?.find(
            (deal) => deal.user_id === user.id && deal.job_posting
          );
          setCanReview(!!eligibleDeal);
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchArtisan();
  }, [id, user]);

const handleChat = () => {
  console.log("DEBUG: Full Artisan Object:", artisan);
  
  // CRITICAL: We need the USER_ID of the artisan for the messages table
  const userIdToSend = artisan.user_id || artisan.id; 
  
  if (!userIdToSend) {
    console.error("ERROR: No ID found to navigate with!");
    return;
  }

  console.log("NAVIGATING TO:", `/chat/${userIdToSend}`);
  navigate(`/chat/${userIdToSend}`);
};

  if (loading) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
  );

  if (!artisan) return <div className="p-20 text-center font-serif italic text-stone-400">Profile hidden or unavailable.</div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 pb-20">
      {/* Hero Section */}
      <header className="relative h-[60vh] bg-stone-900 overflow-hidden">
        <img
          src={`/uploads/${artisan.profile_pic}`}
          alt={artisan.firstname}
          className="w-full h-full object-cover opacity-60 grayscale-[30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="max-w-7xl mx-auto">
            <p className="text-amber-500 text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Master {artisan.skill}</p>
            <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tighter">
              {artisan.firstname} {artisan.lastname}
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16">
        {/* Left Column: Story & Details */}
        <div className="lg:col-span-8 space-y-16">
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-stone-400 mb-6 italic">The Artisan's Narrative</h3>
            <p className="text-2xl font-serif leading-relaxed text-stone-800">
              {artisan.bio || "A dedicated practitioner of traditional methods, bringing soul and precision to every commission."}
            </p>
          </section>

          {/* Portfolio Gallery Integration */}
          {artisan.portfolio?.length > 0 && (
            <section>
               <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-stone-400 mb-8 italic">Work Samples</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {artisan.portfolio.map((file, idx) => (
                    <div key={idx} className="overflow-hidden bg-stone-200 group relative">
                       {file.endsWith(".mp4") ? (
                         <video className="w-full h-full object-cover" muted loop autoPlay><source src={`/uploads/${file}`} /></video>
                       ) : (
                         <img src={`/uploads/${file}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 grayscale-[20%] group-hover:grayscale-0" alt="Work" />
                       )}
                    </div>
                  ))}
               </div>
            </section>
          )}

          {/* Reviews: "The Ledger of Praise" */}
          <section className="pt-16 border-t border-stone-200">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-stone-400 mb-10 italic">Client Testimonials</h3>
            <div className="space-y-12">
              {artisan.job_postings?.flatMap(j => j.reviews).filter(Boolean).length > 0 ? (
                artisan.job_postings.flatMap(j => j.reviews).map((review, i) => (
                  <div key={i} className="max-w-2xl border-l-2 border-amber-600 pl-8 py-2">
                    <p className="font-serif text-xl italic text-stone-700">"{review.comment}"</p>
                    <div className="mt-4 flex items-center gap-4">
                       <span className="text-[10px] font-black uppercase tracking-widest">{review.first_name} {review.last_name}</span>
                       <span className="text-amber-600 text-xs">{"★".repeat(review.rating)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="font-serif italic text-stone-400">No public endorsements yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Credentials & Actions */}
        <aside className="lg:col-span-4 space-y-12">
          <div className="bg-white p-10 shadow-xl shadow-stone-200/50 border border-stone-100">
             <div className="space-y-6 mb-10">
                <div className="flex justify-between border-b border-stone-50 pb-4">
                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Experience</span>
                  <span className="font-serif italic text-stone-800">{artisan.experience} Years</span>
                </div>
                <div className="flex justify-between border-b border-stone-50 pb-4">
                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Location</span>
                  <span className="font-serif italic text-stone-800">{artisan.city}</span>
                </div>
                {artisan.certificate && (
                  <div className="flex justify-between border-b border-stone-50 pb-4">
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Credentials</span>
                    <a href={`/uploads/${artisan.certificate}`} target="_blank" className="text-amber-600 text-[10px] font-black uppercase hover:underline">View Proof</a>
                  </div>
                )}
             </div>

             <div className="space-y-4">
                <button onClick={handleChat} className="w-full bg-stone-900 text-white py-5 text-[10px] uppercase font-bold tracking-[0.3em] hover:bg-amber-600 transition-all shadow-lg">
                  Initiate Discussion
                </button>
                
                {user && canReview && (
                  <button onClick={() => navigate(`/review/${id}`)} className="w-full border border-stone-200 py-5 text-[10px] uppercase font-bold tracking-[0.3em] hover:bg-stone-50 transition-all">
                    Submit Testimonial
                  </button>
                )}
             </div>
          </div>

          <div className="p-10 bg-stone-50 border border-stone-200 italic font-serif text-stone-500 text-sm leading-relaxed">
             "Quality is not an act, it is a habit. Every commission undertaken is a promise of excellence."
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PublicArtisanProfile;