import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Review() {
  const { artisanId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [reviewData, setReviewData] = useState({
    dealId: "",
    rating: 5, // Default to 5 for a premium feel
    comment: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      if (!user?.id || !artisanId) {
        setError("Your identity must be verified to leave a testimonial.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8080/artisan/${artisanId}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const data = await response.json();

        const userDeals = (data.deals || []).filter(
          (deal) => Number(deal.user_id) === Number(user.id) && deal.job_posting
        );
        
        setDeals(userDeals);
        if (userDeals.length === 0) {
          setError("No verified commissions found. Testimonials require a completed job posting.");
        }
        setLoading(false);
      } catch (err) {
        setError(`Failed to synchronize with the ledger: ${err.message}`);
        setLoading(false);
      }
    };

    fetchDeals();
  }, [user, artisanId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewData.dealId || !reviewData.rating || !reviewData.comment) {
      setError("Please ensure the rating and comment are provided.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          artisanId: parseInt(artisanId),
          rating: parseInt(reviewData.rating),
          comment: reviewData.comment,
          dealId: parseInt(reviewData.dealId),
          userId: parseInt(user.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed.");
      }

      setSuccess("Your testimonial has been etched into the registry.");
      setTimeout(() => navigate(`/artisan-profile/${artisanId}`), 2000);
    } catch (err) {
      setError(`Error submitting review: ${err.message}`);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 py-20 px-6">
      <div className="max-w-2xl mx-auto bg-white border border-stone-100 shadow-2xl shadow-stone-200/50 overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="h-1.5 w-full bg-amber-600" />
        
        <div className="p-10 md:p-16">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-serif tracking-tight">The Ledger of Praise</h1>
            <p className="text-amber-600 text-[10px] uppercase tracking-[0.4em] font-bold mt-4">Documenting Craft & Professionalism</p>
          </header>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-2 border-red-500 text-red-700 font-serif italic text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-8 p-4 bg-stone-900 text-amber-500 font-serif italic text-center">
              {success}
            </div>
          )}

          {deals.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Deal Selection */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest">Select Commission</label>
                <select
                  className="w-full bg-stone-50 border-b border-stone-200 py-4 font-serif text-lg outline-none focus:border-amber-600 appearance-none"
                  value={reviewData.dealId}
                  onChange={(e) => setReviewData({ ...reviewData, dealId: e.target.value })}
                  required
                >
                  <option value="">Select an active commission...</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      Project with {deal.first_name} {deal.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Star Rating */}
              <div className="space-y-4">
                <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block text-center">Merit Rating</label>
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`text-3xl transition-all ${reviewData.rating >= star ? "text-amber-500 scale-110" : "text-stone-200 hover:text-amber-200"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest">Testimonial</label>
                <textarea
                  className="w-full bg-stone-50 border border-stone-100 p-6 font-serif italic text-lg leading-relaxed outline-none focus:ring-1 ring-amber-600 min-h-[200px]"
                  placeholder="Describe the quality of work, the attention to detail, and the artisan's conduct..."
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  required
                />
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  className="w-full bg-stone-900 text-white py-6 text-[11px] uppercase font-bold tracking-[0.3em] hover:bg-amber-600 transition-all shadow-xl"
                >
                  Seal Testimonial
                </button>
                <button 
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full mt-4 text-[9px] uppercase font-bold tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                >
                  Cancel Entry
                </button>
              </div>
            </form>
          )}

          {!user?.id && (
            <div className="text-center pt-10">
              <button 
                onClick={() => navigate("/signin")}
                className="bg-stone-900 text-white px-12 py-4 text-[10px] uppercase font-bold tracking-widest"
              >
                Identify Yourself (Sign In)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Review;