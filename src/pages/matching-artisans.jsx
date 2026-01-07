import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function MatchingArtisansPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const city = queryParams.get('city');
  const artisan = queryParams.get('artisan');
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArtisans = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8080/artisans?artisan=${encodeURIComponent(artisan)}&city=${encodeURIComponent(city)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError('Could not fetch matching artisans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (city && artisan) fetchArtisans();
  }, [artisan, city]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-16 px-6 md:px-12 lg:px-24">
      {/* Search Context Header */}
      <header className="max-w-6xl mx-auto mb-16 border-b border-stone-200 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 tracking-tight">
              Verified <span className="italic text-amber-600 font-light">{artisan}s</span>
            </h1>
            <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold">
              Available in {city} territory
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-1">Results Found</p>
              <p className="text-2xl font-serif text-stone-900">{results.length}</p>
            </div>
            <button 
              onClick={() => navigate('/workers')} 
              className="px-6 py-3 border border-stone-900 text-[10px] uppercase tracking-widest font-bold hover:bg-stone-900 hover:text-white transition-all"
            >
              Modify Search
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Consulting the Registry...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-8 text-center border border-red-100">
            <p className="text-red-800 font-serif italic">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-24 bg-white border border-dashed border-stone-200">
            <h3 className="text-2xl font-serif text-stone-400 mb-4">No Master Artisans Found</h3>
            <p className="text-stone-500 font-light max-w-sm mx-auto mb-8">
              We couldn't find any verified {artisan}s in {city} at this time.
            </p>
            <button 
              onClick={() => navigate('/workers')}
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-600 border-b-2 border-amber-600 pb-1 hover:text-stone-900 hover:border-stone-900 transition-all"
            >
              Explore Other Areas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {results.map((item, i) => (
              <div 
                key={i} 
                className="group bg-white border border-stone-100 p-8 flex flex-col hover:border-amber-500 transition-all duration-500 hover:shadow-2xl hover:shadow-stone-200/50"
              >
                {/* Visual Accent */}
                <div className="w-12 h-[1px] bg-amber-600 mb-6 group-hover:w-full transition-all duration-700" />
                
                <div className="flex-grow space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Verified Professional</p>
                    <h3 className="text-2xl font-serif text-stone-900 group-hover:text-amber-600 transition-colors">
                      {item.firstname} {item.lastname}
                    </h3>
                  </div>

                  <div className="space-y-3 py-4">
                    <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                        <span className="text-[10px] uppercase text-stone-400 font-medium">Expertise</span>
                        <span className="text-xs font-bold text-stone-800 tracking-wide">{item.skill}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                        <span className="text-[10px] uppercase text-stone-400 font-medium">Location</span>
                        <span className="text-xs text-stone-800">{item.city}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase text-stone-400 font-medium">Experience</span>
                        <span className="text-xs text-stone-800">{item.experience || '5+'} Years</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/artisan-profile/${item.id}`)}
                  className="mt-8 w-full py-4 bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-amber-600 transition-all shadow-lg active:scale-95"
                >
                  View Full Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer Decoration */}
      <footer className="mt-32 text-center opacity-30">
        <p className="text-[10px] uppercase tracking-[0.5em] text-stone-400 font-bold">The Guild Registry</p>
      </footer>
    </div>
  );
}

export default MatchingArtisansPage;