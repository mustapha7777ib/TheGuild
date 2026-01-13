import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext.jsx';

function PurchaseCoins() {
  const { user, artisanId, isArtisan, coins, loading, updateCoins } = useAuth();
  const [coinAmount, setCoinAmount] = useState(50);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  // Pricing constant
  const RATE = 10; 

  useEffect(() => {
    if (loading) return;
    if (!user || !isArtisan || !artisanId) {
      navigate("/signin");
    }
  }, [user, isArtisan, artisanId, loading, navigate]);

  const handlePurchase = async () => {
    if (!coinAmount || coinAmount <= 0) {
      setError("Please enter a valid amount of coins");
      return;
    }

    setIsProcessing(true);
    try {
      setError("");
      setSuccess("");

      const response = await fetch(`/api/artisan/${artisanId}/purchase-coins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: coinAmount * RATE,
          email: user.email,
          coin_amount: coinAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initialize");
      }

      const { reference } = await response.json();

      const handler = window.PaystackPop.setup({
        key: "pk_test_154fa68f5b3c489ae2ad5a68084ac91a8f606850",
        email: user.email,
        amount: coinAmount * RATE * 100, // Kobo
        ref: reference,
        onClose: () => {
          setIsProcessing(false);
          setError("Transaction closed by user.");
        },
        callback: async (response) => {
          try {
            const verifyResponse = await fetch("/api/artisan/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reference: response.reference,
                artisan_id: artisanId,
                coin_amount: coinAmount,
              }),
            });

            if (verifyResponse.ok) {
              const { coins: newCoins } = await verifyResponse.json();
              updateCoins(newCoins);
              setSuccess(`Treasury Updated: +${coinAmount} Guild Coins`);
              setCoinAmount(50);
            } else {
              setError("Verification failed. Please contact the Guild.");
            }
          } catch (err) {
            setError("Connection error during verification.");
          } finally {
            setIsProcessing(false);
          }
        },
      });

      handler.openIframe();
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-10 h-10 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-20 px-6">
      <div className="max-w-xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-serif text-stone-900 mb-3 tracking-tight">The Guild Treasury</h1>
          <p className="text-amber-600 text-[10px] uppercase tracking-[0.3em] font-bold">Acquire Coins to Unlock Leads</p>
        </header>

        {/* Balance Display */}
        <div className="bg-stone-900 p-10 text-center mb-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
            <p className="text-stone-400 text-[10px] uppercase tracking-[0.2em] mb-2">Current Purse</p>
            <h2 className="text-5xl font-serif text-white">{coins} <span className="text-amber-500 text-lg uppercase tracking-widest ml-2">Coins</span></h2>
        </div>

        {/* Purchase Interface */}
        <div className="bg-white border border-stone-100 p-8 md:p-12 shadow-xl shadow-stone-200/50">
          
          {error && <p className="mb-6 p-4 bg-red-50 text-red-700 text-[10px] uppercase tracking-widest font-bold border-l-4 border-red-500">{error}</p>}
          {success && <p className="mb-6 p-4 bg-amber-50 text-amber-700 text-[10px] uppercase tracking-widest font-bold border-l-4 border-amber-500">{success}</p>}

          <div className="space-y-8">
            {/* Quick Selection */}
            <div className="grid grid-cols-3 gap-4">
                {[50, 100, 500].map((amt) => (
                    <button 
                        key={amt}
                        onClick={() => setCoinAmount(amt)}
                        className={`py-4 border text-[10px] font-bold uppercase tracking-widest transition-all ${coinAmount === amt ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-100 text-stone-400 hover:border-stone-300'}`}
                    >
                        {amt} Coins
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                <label className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">Custom Amount</label>
                <div className="relative">
                    <input 
                        type="number" 
                        value={coinAmount}
                        onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                        className="w-full border-b border-stone-200 py-3 outline-none focus:border-amber-600 transition-all font-serif text-2xl"
                        placeholder="Enter amount"
                    />
                    <span className="absolute right-0 bottom-3 text-[10px] uppercase font-bold text-stone-300">Amount</span>
                </div>
            </div>

            <div className="bg-stone-50 p-6 flex justify-between items-center">
                <span className="text-stone-400 text-[10px] uppercase tracking-widest font-bold">Total Investment</span>
                <span className="text-stone-900 font-serif text-xl">₦ {(coinAmount * RATE).toLocaleString()}</span>
            </div>

            <button 
                onClick={handlePurchase}
                disabled={isProcessing || coinAmount <= 0}
                className="w-full py-5 bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-amber-600 disabled:bg-stone-200 transition-all shadow-lg active:scale-95"
            >
                {isProcessing ? "Opening Treasury..." : "Buy Coins with Paystack"}
            </button>
            
            <p className="text-center text-[9px] text-stone-400 uppercase tracking-widest">
                Secure transaction powered by Paystack. 1 Coin = ₦10.00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseCoins;