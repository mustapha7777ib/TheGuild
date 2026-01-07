import React, { useState, useEffect, useMemo, useRef } from 'react';
import icon1 from "../images/icons8-search.svg";
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';

Modal.setAppElement('#root');

function Workers() {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    
    const abujaData = useMemo(() => [
        "Asokoro", "Maitama", "Wuse", "Garki", "Gwarimpa", "Lokogoma", "Jabi", "Utako", "Katampe Extension Hill",
        "Kuje", "Abaji", "Bwari", "Gwagwalada", "Kwali", "Abuja Municipal Area Council (AMAC)", "Dawaki", "Gwagwa",
        "Nyanya", "Kubwa", "Olu Awotesu Street", "Lugbe", "Guzape", "Apo Dutse", "Dakibiyu", "Duboyi", "Durumi",
        "Gaduwa", "Games Village", "Kaura", "Gudu", "Jahi", "Kado", "Kukwaba", "Mabushi", "Wuye", "Galadimawa",
        "Kabusa", "Karmo", "Life Camp", "Nbora"
    ], []);

    const jobs = [
        "Carpenter", "Electrician", "Plumber", "Welder",
        "Tiler", "Cleaner", "Painter", "Gardener", "Technician",
    ];

    const [citySearch, setCitySearch] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedArtisanIdx, setSelectedArtisanIdx] = useState(null);
    const [showErrors, setShowErrors] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowCityDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCities = useMemo(() => {
        return abujaData.filter(c => 
            c.toLowerCase().includes(citySearch.toLowerCase())
        );
    }, [citySearch, abujaData]);

    const handleProceed = () => {
        setShowErrors(true);
        if (selectedCity && selectedArtisanIdx !== null) {
            navigate(`/matching-artisans?artisan=${encodeURIComponent(jobs[selectedArtisanIdx])}&city=${encodeURIComponent(selectedCity)}`);
        }
    };

    return (
        <div className="min-h-[100vh] bg-[#FAF9F6] flex flex-col items-center justify-center px-6 py-20">
            {/* Hero Section */}
            <div className="max-w-4xl w-full text-center space-y-6 mb-12">
                <h1 className="text-4xl md:text-6xl font-serif text-stone-900 tracking-tight leading-tight">
                    Get Trusted <span className="italic text-amber-600">Artisans</span> <br />
                    for Your Home Needs
                </h1>
                <p className="text-stone-500 font-light max-w-2xl mx-auto leading-relaxed">
                    Easily connect with experienced and verified professionals for cleaning, 
                    electrical work, maintenance, and plumbing. Simply post your task and 
                    receive a quote in no time.
                </p>
            </div>

            {/* Search Trigger Bar */}
            <div 
                onClick={() => setIsOpen(true)}
                className="w-full max-w-2xl bg-white border border-stone-200 p-6 flex items-center justify-between cursor-pointer hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-500 group"
            >
                <span className="text-stone-400 font-serif italic text-lg group-hover:text-stone-600 transition-colors">
                    {selectedArtisanIdx !== null ? `Hiring a ${jobs[selectedArtisanIdx]}` : "What type of artisan do you want to hire?"}
                </span>
                <div className="bg-stone-900 p-3 group-hover:bg-amber-600 transition-colors">
                    <img className="w-5 h-5 invert" src={icon1} alt="search" />
                </div>
            </div>

            {/* Quick Select Badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-10 max-w-3xl">
                {jobs.slice(0, 5).map((j, i) => (
                    <button
                        key={i}
                        onClick={() => { setSelectedArtisanIdx(i); setIsOpen(true); }}
                        className="px-6 py-2 border border-stone-200 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 hover:border-amber-500 hover:text-amber-600 transition-all"
                    >
                        {j}
                    </button>
                ))}
            </div>

            {/* Selection Modal */}
            <Modal
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                className="outline-none"
                overlayClassName="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
                <div className="bg-white w-full max-w-md p-8 md:p-12 shadow-2xl animate-in fade-in zoom-in duration-300 relative">
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 text-stone-300 hover:text-stone-900 text-xl"
                    >✕</button>

                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-serif text-stone-900 mb-2">The Guild Search</h2>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 font-bold">Select Craft & Location</p>
                    </div>

                    <div className="space-y-8">
                        {/* Artisan Grid */}
                        <div className="space-y-3">
                            <label className="text-[9px] uppercase font-bold text-stone-400 tracking-[0.2em]">Master Craft *</label>
                            <div className="grid grid-cols-2 gap-2">
                                {jobs.map((j, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setSelectedArtisanIdx(i); setShowErrors(false); }}
                                        className={`py-3 px-4 text-[10px] uppercase tracking-widest font-bold border transition-all ${
                                            selectedArtisanIdx === i 
                                            ? 'bg-stone-900 text-white border-stone-900' 
                                            : 'bg-white text-stone-400 border-stone-100 hover:border-stone-300'
                                        }`}
                                    >
                                        {j}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location Input */}
                        <div className="space-y-3 relative" ref={dropdownRef}>
                            <label className="text-[9px] uppercase font-bold text-stone-400 tracking-[0.2em]">Abuja Territory *</label>
                            <input
                                className={`w-full border-b py-3 outline-none text-stone-800 transition-all ${
                                    showErrors && !selectedCity ? 'border-red-500' : 'border-stone-200 focus:border-amber-600'
                                }`}
                                placeholder="Search Area (e.g. Maitama)"
                                value={selectedCity || citySearch}
                                onChange={(e) => {
                                    setCitySearch(e.target.value);
                                    setSelectedCity('');
                                    setShowCityDropdown(true);
                                }}
                                onFocus={() => setShowCityDropdown(true)}
                            />
                            
                            {showCityDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-stone-100 shadow-2xl max-h-48 overflow-y-auto">
                                    {filteredCities.length > 0 ? filteredCities.map((c, i) => (
                                        <div
                                            key={i}
                                            className="px-5 py-3 hover:bg-stone-50 cursor-pointer text-sm text-stone-600 border-b border-stone-50 last:border-none"
                                            onClick={() => {
                                                setSelectedCity(c);
                                                setCitySearch(c);
                                                setShowCityDropdown(false);
                                                setShowErrors(false);
                                            }}
                                        >
                                            {c}
                                        </div>
                                    )) : (
                                        <div className="px-5 py-3 text-xs text-stone-400 italic">No area found in Abuja</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Validation Error Message */}
                        {showErrors && (selectedArtisanIdx === null || !selectedCity) && (
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center italic">
                                Please select both craft and location
                            </p>
                        )}

                        <button
                            className="w-full py-5 bg-stone-900 text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-amber-700 transition-all shadow-lg active:scale-95"
                            onClick={handleProceed}
                        >
                            Find Master Artisan
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Workers;