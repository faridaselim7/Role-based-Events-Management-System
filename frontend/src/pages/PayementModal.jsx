// src/components/PaymentModal.jsx
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import { X, CreditCard, Wallet, CheckCircle } from "lucide-react";
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOformStyles,
  EOcardStyles,
  EOradius,
  EOtransitions,
  EOtypography,
} from "../styles/EOdesignSystem";

// Initialize Stripe outside component to prevent re-initialization
const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY || process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

// Only initialize if key exists
let stripePromise = null;
if (stripePublicKey && stripePublicKey !== 'your_public_key_here') {
  stripePromise = loadStripe(stripePublicKey);
} else {
  console.warn("⚠️ Stripe public key not configured");
}

const StripePaymentForm = ({ amount, eventName, onSuccess, onCancel, currentUser }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setError("Stripe is not loaded yet. Please wait.");
      return;
    }

    setError("");
    setProcessing(true);

    try {
      const res = await fetch(`${API_BASE}/api/payments/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount, 
          currency: "usd", 
          description: `Payment for ${eventName}` 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create payment intent");
      }

      const data = await res.json();
      const { clientSecret, paymentIntentId } = data;

      if (!clientSecret) {
        throw new Error("No client secret received from server");
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        onSuccess("stripe", paymentIntentId || result.paymentIntent.id);
      } else {
        setError("Payment was not successful. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className="p-5 rounded-2xl border-2 transition-all"
        style={{
          borderColor: error ? EOcolors.error : EOcolors.lightSilver,
          backgroundColor: EOcolors.light,
        }}
      >
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: EOcolors.text.primary,
                fontFamily: "inherit",
                "::placeholder": { color: EOcolors.text.muted },
              },
              invalid: { color: EOcolors.error },
            },
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: `${EOcolors.error}15` }}>
          <X className="w-5 h-5" style={{ color: EOcolors.error }} />
          <p style={{ ...EOtypography.bodySmall, color: EOcolors.error, margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="flex gap-4 pt-6">
        <button
          type="submit"
          disabled={!stripe || processing}
          style={{
            ...EObuttonStyles.primary,
            flex: 1,
            padding: "1.5rem 2rem",
            fontSize: "1.125rem",
            fontWeight: "700",
            minHeight: "60px",
            borderRadius: EOradius.xl,
            opacity: !stripe || processing ? 0.6 : 1,
          }}
          className="btn-register"
        >
          {processing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          style={{
            flex: 1,
            padding: "1.5rem 2rem",
            fontSize: "1.125rem",
            fontWeight: "700",
            minHeight: "60px",
            borderRadius: EOradius.xl,
            background: `linear-gradient(135deg, ${EOcolors.error}, ${EOcolors.errorDark || EOcolors.error})`,
            color: "white",
            border: "none",
            boxShadow: EOshadows.md,
            transition: EOtransitions.normal,
            cursor: processing ? "not-allowed" : "pointer",
            opacity: processing ? 0.6 : 1,
          }}
          onMouseEnter={(e) => !processing && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = EOshadows.lg)}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = EOshadows.md)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default function PaymentModal({ open, onClose, eventName, amount, onSuccess, currentUser: passedUser }) {
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [currentUser, setCurrentUser] = useState(passedUser || null);
  const [stripeAvailable, setStripeAvailable] = useState(false);

  useEffect(() => {
    // Check if Stripe is actually available
    setStripeAvailable(!!stripePromise);
    
    // Use passed user first, otherwise load from localStorage
    if (passedUser) {
      setCurrentUser(passedUser);
      console.log("💳 Payment modal using passed user:", {
        wallet: passedUser.wallet,
        email: passedUser.email
      });
    } else {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setCurrentUser(user);
          console.log("💳 Payment modal loaded user from storage:", {
            wallet: user.wallet,
            email: user.email
          });
        } catch (e) {
          console.error("Failed to parse user in payment modal:", e);
        }
      }
    }
  }, [passedUser]);

  if (!open) return null;

  const handlePayment = (method, paymentIntentId = null) => {
    console.log("💰 Payment completed:", { method, amount, paymentIntentId });
    
    // Validate payment before calling onSuccess
    if (method === 'wallet') {
      const balance = Number(currentUser?.wallet || 0);
      if (balance < amount) {
        console.error("❌ Insufficient wallet balance:", { balance, required: amount });
        return; // Don't proceed
      }
    }
    
    onSuccess(method, paymentIntentId);
  };

  const walletBalance = Number(currentUser?.wallet || 0);
  const hasEnoughBalance = walletBalance >= amount;
  
  console.log("💳 Payment Modal State:", {
    amount,
    walletBalance,
    hasEnoughBalance,
    paymentMethod,
    stripeAvailable,
    currentUserExists: !!currentUser
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-3xl overflow-hidden relative"
        style={{
          ...EOcardStyles.base,
          border: `2px solid ${EOcolors.lightSilver}`,
          boxShadow: EOshadows.xl,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-3 rounded-full transition-all hover:scale-110"
          style={{ backgroundColor: `${EOcolors.error}15` }}
        >
          <X className="w-6 h-6" style={{ color: EOcolors.error }} />
        </button>

        {/* Header */}
        <div
          className="px-10 py-10 text-center flex-shrink-0"
          style={{
            backgroundColor: EOcolors.light,
            borderBottom: `1px solid ${EOcolors.lightSilver}`,
          }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-white shadow-md">
              <CreditCard className="w-10 h-10" style={{ color: EOcolors.primary }} />
            </div>
          </div>
          <h2 style={{ ...EOtypography.h2, color: EOcolors.secondary, margin: "0 0 0.5rem 0" }}>
            Complete Your Payment
          </h2>
          <p style={{ ...EOtypography.body, color: EOcolors.text.secondary, margin: 0 }}>
            {eventName}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-10 overflow-y-auto" style={{ flex: 1 }}>
          {/* Amount */}
          <div className="text-center mb-10 p-8 rounded-3xl" style={{
            backgroundColor: EOcolors.light,
            border: `2px solid ${EOcolors.lightSilver}`,
          }}>
            <p style={{ ...EOtypography.labelSmall, color: EOcolors.text.secondary, marginBottom: "0.5rem" }}>
              Total Amount Due
            </p>
            <p style={{
              fontSize: "3.5rem",
              fontWeight: "900",
              color: EOcolors.primary,
              margin: 0,
              letterSpacing: "-0.05em",
            }}>
              ${amount.toFixed(2)}
            </p>
            {currentUser && (
              <p style={{ 
                marginTop: "1rem", 
                fontSize: "1rem", 
                color: EOcolors.text.secondary 
              }}>
                Your wallet: ${walletBalance.toFixed(2)}
              </p>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-6 mb-8">
            <p style={{ ...EOtypography.label, color: EOcolors.secondary }}>
              Choose Payment Method
            </p>

            {/* Wallet Option */}
            <label 
              className={`flex items-center gap-5 p-6 rounded-2xl transition-all ${
                hasEnoughBalance ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed opacity-60'
              }`}
              style={{
                backgroundColor: paymentMethod === "wallet" ? `${EOcolors.primary}08` : EOcolors.light,
                border: `2px solid ${paymentMethod === "wallet" ? EOcolors.primary : EOcolors.lightSilver}`,
                boxShadow: EOshadows.sm,
              }}
            >
              <input 
                type="radio" 
                name="method" 
                checked={paymentMethod === "wallet"} 
                onChange={() => hasEnoughBalance && setPaymentMethod("wallet")} 
                disabled={!hasEnoughBalance}
                className="w-5 h-5" 
                style={{ accentColor: EOcolors.primary }} 
              />
              <div className="flex items-center gap-4 flex-1">
                <div className="p-4 rounded-xl" style={{ backgroundColor: `${EOcolors.tertiary}15` }}>
                  <Wallet className="w-7 h-7" style={{ color: EOcolors.tertiary }} />
                </div>
                <div>
                  <p style={{ ...EOtypography.label, color: EOcolors.secondary, margin: 0 }}>
                    Wallet Payment
                  </p>
                  <p style={{ ...EOtypography.bodySmall, color: EOcolors.text.secondary, marginTop: "0.25rem" }}>
                    {hasEnoughBalance 
                      ? `Balance: $${walletBalance.toFixed(2)}`
                      : `Insufficient balance (need $${(amount - walletBalance).toFixed(2)} more)`
                    }
                  </p>
                </div>
                {paymentMethod === "wallet" && hasEnoughBalance && (
                  <CheckCircle className="w-6 h-6 ml-auto" style={{ color: EOcolors.primary }} />
                )}
              </div>
            </label>

            {/* Stripe Option - Only show if Stripe is configured */}
            {stripeAvailable ? (
              <label 
                className="flex items-center gap-5 p-6 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: paymentMethod === "stripe" ? `${EOcolors.primary}08` : EOcolors.light,
                  border: `2px solid ${paymentMethod === "stripe" ? EOcolors.primary : EOcolors.lightSilver}`,
                  boxShadow: EOshadows.sm,
                }}
              >
                <input 
                  type="radio" 
                  name="method" 
                  checked={paymentMethod === "stripe"} 
                  onChange={() => setPaymentMethod("stripe")} 
                  className="w-5 h-5" 
                  style={{ accentColor: EOcolors.primary }} 
                />
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-4 rounded-xl" style={{ backgroundColor: `${EOcolors.primary}15` }}>
                    <CreditCard className="w-7 h-7" style={{ color: EOcolors.primary }} />
                  </div>
                  <div>
                    <p style={{ ...EOtypography.label, color: EOcolors.secondary, margin: 0 }}>
                      Credit / Debit Card
                    </p>
                    <p style={{ ...EOtypography.bodySmall, color: EOcolors.text.secondary, marginTop: "0.25rem" }}>
                      Secure payment via Stripe
                    </p>
                  </div>
                  {paymentMethod === "stripe" && (
                    <CheckCircle className="w-6 h-6 ml-auto" style={{ color: EOcolors.primary }} />
                  )}
                </div>
              </label>
            ) : (
              <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-2xl">
                <p className="text-gray-600 text-sm text-center">
                  💳 Card payments are not configured. Please use wallet payment.
                </p>
              </div>
            )}
          </div>

          {/* Payment Content */}
          {paymentMethod === "wallet" ? (
            <div className="space-y-4">
              {!hasEnoughBalance && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ You need ${(amount - walletBalance).toFixed(2)} more in your wallet to complete this purchase.
                  </p>
                </div>
              )}
              
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => {
                    console.log("🔘 Wallet payment button clicked:", { hasEnoughBalance, walletBalance, amount });
                    if (hasEnoughBalance) {
                      handlePayment("wallet");
                    }
                  }}
                  disabled={!hasEnoughBalance}
                  style={{
                    ...EObuttonStyles.primary,
                    padding: "1.5rem 4rem",
                    fontSize: "1.125rem",
                    fontWeight: "700",
                    minWidth: "340px",
                    minHeight: "68px",
                    borderRadius: EOradius.xl,
                    opacity: hasEnoughBalance ? 1 : 0.5,
                    cursor: hasEnoughBalance ? "pointer" : "not-allowed",
                  }}
                  className="btn-register"
                >
                  {hasEnoughBalance 
                    ? `Pay with Wallet • $${amount.toFixed(2)}`
                    : "Insufficient Balance"
                  }
                </button>
              </div>
            </div>
          ) : stripeAvailable && stripePromise ? (
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                amount={amount}
                eventName={eventName}
                onSuccess={handlePayment}
                onCancel={() => setPaymentMethod("wallet")}
                currentUser={currentUser}
              />
            </Elements>
          ) : (
            <div className="text-center p-8 bg-red-50 rounded-2xl border-2 border-red-200">
              <p className="text-red-600 font-semibold mb-2">Stripe Not Configured</p>
              <p className="text-sm text-gray-600 mb-4">
                Please configure REACT_APP_STRIPE_PUBLIC_KEY in your environment variables
              </p>
              <button
                onClick={() => setPaymentMethod("wallet")}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Use Wallet Instead
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}