import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function PurchaseCoins() {
  const { user, artisanId, isArtisan, coins, loading, updateCoins } = useAuth();
  const [coinAmount, setCoinAmount] = useState(50);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    console.log("PurchaseCoins.jsx: user:", user, "artisanId:", artisanId, "isArtisan:", isArtisan);
    if (loading) return;
    if (!user || !user.id || !isArtisan || !artisanId) {
      console.log("Not an artisan or not logged in, redirecting to signin");
      navigate("/signin");
    }
  }, [user, isArtisan, artisanId, loading, navigate]);

  const handlePurchase = async () => {
    if (!coinAmount || coinAmount <= 0 || isNaN(coinAmount)) {
      setError("Please enter a valid number of coins");
      return;
    }

    try {
      setError("");
      setSuccess("");
      console.log(`Initializing transaction for artisanId: ${artisanId}, coins: ${coinAmount}`);

      // Initialize transaction
      const response = await fetch(`http://localhost:8080/artisan/${artisanId}/purchase-coins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: coinAmount * 10, // 1 coin = NGN 10
          email: user.email,
          coin_amount: coinAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to initialize transaction:", errorData);
        setError(errorData.error || `Failed to initialize transaction: ${response.status}`);
        return;
      }

      const { authorization_url, reference } = await response.json();
      console.log("Transaction initialized:", { authorization_url, reference });

      // Open Paystack payment popup
      const handler = window.PaystackPop.setup({
        key: "pk_test_154fa68f5b3c489ae2ad5a68084ac91a8f606850",
        email: user.email,
        amount: coinAmount * 10 * 100, // Convert to kobo
        ref: reference,
        onClose: () => {
          console.log("Payment popup closed");
          setError("Payment was cancelled");
        },
        callback: async (response) => {
          console.log("Payment callback:", response);
          try {
            // Verify transaction
            const verifyResponse = await fetch("http://localhost:8080/artisan/verify-payment", {
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
              console.log("Coins updated:", newCoins);
              updateCoins(newCoins);
              setSuccess(`Successfully purchased ${coinAmount} coins! New balance: ${newCoins}`);
              setError("");
            } else {
              const errorData = await verifyResponse.json();
              console.error("Failed to verify transaction:", errorData);
              setError(errorData.error || `Failed to verify transaction: ${verifyResponse.status}`);
            }
          } catch (err) {
            console.error("Error verifying transaction:", err.message, err.stack);
            setError("Error verifying transaction. Please try again.");
          }
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error("Error initiating payment:", err.message, err.stack);
      setError("Error initiating payment. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isArtisan) {
    return (
      <div className="purchase-coins-container">
        <h2 className="title">Purchase Coins</h2>
        <p className="error-message">This page is only for artisans.</p>
      </div>
    );
  }

  return (
    <div className="purchase-coins-container-head">
    <div className="purchase-coins-container">
      <h2 className="title">Purchase Coins</h2>
      <p className="current-balance">Current Balance: {coins} coins</p>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <div className="purchase-form">
        <label htmlFor="coin-amount" className="form-label">
          Number of Coins to Purchase:
        </label>
        <input
          type="number"
          id="coin-amount"
          value={coinAmount}
          onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
          min="1"
          className="form-input"
          placeholder="Enter number of coins"
        />
        <p className="cost-info">
          Cost: NGN {coinAmount * 10} (NGN 10 per coin)
        </p>
        <button onClick={handlePurchase} className="purchase-btn">
          Buy Coins with Paystack
        </button>
      </div>
    </div>
    </div>
  );
}

export default PurchaseCoins;