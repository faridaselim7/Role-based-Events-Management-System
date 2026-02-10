import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "../components/ui/button";

// Replace with your Stripe public key
// Stripe public key (from env or fallback string)
const STRIPE_PUBLIC_KEY =
  import.meta?.env?.VITE_STRIPE_PUBLIC_KEY ||
  process.env?.REACT_APP_STRIPE_PUBLIC_KEY ||
  "pk_test_YOUR_PUBLIC_KEY"; // TODO: replace with real key in production

// Only call loadStripe if we actually have a key
const stripePromise = STRIPE_PUBLIC_KEY
  ? loadStripe(STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = ({ amount, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    if (!stripe || !elements) return; 
    setLoading(true);
    setError("");

    try {
      // 1. Call your backend to create a payment intent
      const res = await fetch("http://localhost:5001/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }), // amount in cents
      });
      const data = await res.json();
      const clientSecret = data.clientSecret;

      // 2. Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        onSuccess(result.paymentIntent);
      }
    } catch (err) {
      setError(err.message || "Payment failed");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <CardElement className="p-2 border border-gray-300 rounded" />
      {error && <p className="text-red-500">{error}</p>}
      <Button
        onClick={handlePay}
        disabled={!stripe || loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      >
        {loading ? "Processing..." : `Pay $${amount}`}
      </Button>
      <Button onClick={onClose} className="w-full mt-2 border border-gray-300">
        Cancel
      </Button>
    </div>
  );
};

export default function StripePayment({ amount, onSuccess, onClose }) {
  // If Stripe isn't configured, show a simple fallback instead of crashing
  if (!stripePromise) {
    console.warn("Stripe disabled: missing public key");
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-500">
          Payments are not configured on this environment.
        </p>
        <Button onClick={onClose} className="w-full border border-gray-300">
          Close
        </Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} onClose={onClose} />
    </Elements>
  );
}