import { useState } from "react";

import { CreditCard, Wallet, X, AlertCircle } from "lucide-react";

import { loadStripe } from "@stripe/stripe-js";

import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";



const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);



// Card element styling

const CARD_ELEMENT_OPTIONS = {

  style: {

    base: {

      color: "#32325d",

      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',

      fontSmoothing: "antialiased",

      fontSize: "16px",

      "::placeholder": {

        color: "#aab7c4",

      },

    },

    invalid: {

      color: "#fa755a",

      iconColor: "#fa755a",

    },

  },

};



// Payment Form Component (uses Stripe hooks)

function PaymentForm({ application, applicationType, onClose, onSuccess }) {

  const stripe = useStripe();

  const elements = useElements();

  const [paymentMethod, setPaymentMethod] = useState("wallet");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");



  const amount = application.amountDue || 0;



  const handleWalletPayment = async () => {

    setLoading(true);

    setError("");



    try {

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const vendorEmail = user.email;



      if (!vendorEmail) {

        throw new Error('Vendor email not found. Please log in again.');

      }



      console.log('💰 Processing wallet payment...');



      const res = await fetch(`http://localhost:5001/api/vendors/applications/${application._id}/pay`, {

        method: "POST",

        headers: { 

          "Content-Type": "application/json",

          Authorization: `Bearer ${localStorage.getItem("token")}`,

        },

        body: JSON.stringify({

          paymentMethod: "wallet",

          amount: amount,

          vendorEmail: vendorEmail

        })

      });



      const data = await res.json();



      if (!res.ok) {

        throw new Error(data.message || "Payment failed");

      }



      console.log('✅ Wallet payment successful');

      alert("✅ Payment successful! Check your email for the receipt and QR codes.");

      onSuccess();

      onClose();

    } catch (err) {

      console.error('❌ Wallet payment error:', err);

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };



  const handleStripePayment = async () => {

    if (!stripe || !elements) {

      setError("Stripe not loaded yet. Please try again.");

      return;

    }



    setLoading(true);

    setError("");



    try {

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const vendorEmail = user.email;



      if (!vendorEmail) {

        throw new Error('Vendor email not found. Please log in again.');

      }



      // Step 1: Create payment intent

      console.log('💳 Creating payment intent for amount:', amount);

      const intentRes = await fetch("http://localhost:5001/api/vendors/create-payment-intent", {

        method: "POST",

        headers: { 

          "Content-Type": "application/json",

          Authorization: `Bearer ${localStorage.getItem("token")}`,

        },

        body: JSON.stringify({ 

          amount: amount, // Pass amount in dollars

          vendorEmail: vendorEmail,

          applicationId: application._id

        })

      });



      // Check if response is JSON

      const contentType = intentRes.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {

        const text = await intentRes.text();

        console.error('❌ Non-JSON response:', text.substring(0, 200));

        throw new Error("Server returned an error. Please check if the payment endpoint exists.");

      }



      const intentData = await intentRes.json();



      if (!intentRes.ok) {

        throw new Error(intentData.message || "Failed to create payment intent");

      }



      const { clientSecret } = intentData;



      if (!clientSecret) {

        console.error('❌ Response data:', intentData);

        throw new Error("No client secret received from server");

      }



      console.log('✅ Payment intent created');



      // Step 2: Confirm card payment

      console.log('💳 Confirming card payment...');

      const result = await stripe.confirmCardPayment(clientSecret, {

        payment_method: {

          card: elements.getElement(CardElement),

          billing_details: {

            email: vendorEmail,

          },

        },

      });



      if (result.error) {

        throw new Error(result.error.message);

      }



      if (result.paymentIntent.status !== 'succeeded') {

        throw new Error('Payment was not successful');

      }



      console.log('✅ Payment confirmed:', result.paymentIntent.id);



      // Step 3: Update application in backend

      console.log('📝 Updating application...');

      const confirmRes = await fetch(`http://localhost:5001/api/vendors/applications/${application._id}/pay`, {

        method: "POST",

        headers: { 

          "Content-Type": "application/json",

          Authorization: `Bearer ${localStorage.getItem("token")}`,

        },

        body: JSON.stringify({

          paymentMethod: "stripe",

          amount: amount,

          stripePaymentIntentId: result.paymentIntent.id,

          vendorEmail: vendorEmail

        })

      });



      const confirmData = await confirmRes.json();



      if (!confirmRes.ok) {

        throw new Error(confirmData.message || "Payment confirmation failed");

      }



      console.log('✅ Application updated');

      alert("✅ Payment successful! Check your email for the receipt and QR codes.");

      onSuccess();

      onClose();

    } catch (err) {

      console.error('❌ Stripe payment error:', err);

      setError(err.message || "Payment failed. Please try again.");

    } finally {

      setLoading(false);

    }

  };



  const handlePayment = () => {

    if (paymentMethod === "wallet") {

      handleWalletPayment();

    } else if (paymentMethod === "stripe") {

      handleStripePayment();

    }

  };



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">

        {/* Header */}

        <div className="flex items-center justify-between p-6 border-b border-gray-200">

          <h3 className="text-xl font-semibold text-gray-900">Complete Payment</h3>

          <button

            onClick={onClose}

            className="text-gray-400 hover:text-gray-600 transition-colors"

            disabled={loading}

          >

            <X className="w-6 h-6" />

          </button>

        </div>



        {/* Content */}

        <div className="p-6">

          {/* Amount Due */}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">

            <div className="flex justify-between items-center">

              <span className="text-sm font-medium text-gray-700">Amount Due:</span>

              <span className="text-2xl font-bold" style={{ color: '#307B8E' }}>

                ${amount.toFixed(2)}

              </span>

            </div>

            <p className="text-xs text-gray-600 mt-2">

              {applicationType === 'bazaar' ? 'Bazaar' : 'Booth'} participation fee

            </p>

          </div>



          {/* Payment Method Selection */}

          <div className="space-y-3 mb-6">

            <label className="block text-sm font-semibold text-gray-700 mb-2">

              Select Payment Method

            </label>



            {/* Wallet Option */}

            <button

              type="button"

              onClick={() => setPaymentMethod("wallet")}

              disabled={loading}

              className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${

                paymentMethod === "wallet"

                  ? "border-blue-600 bg-blue-50"

                  : "border-gray-200 hover:border-gray-300"

              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}

            >

              <Wallet className="w-5 h-5 text-blue-600" />

              <div className="flex-1 text-left">

                <div className="font-semibold text-gray-900">Wallet Balance</div>

                <div className="text-xs text-gray-600">Pay from your account wallet</div>

              </div>

              {paymentMethod === "wallet" && (

                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">

                  <div className="w-2 h-2 rounded-full bg-white"></div>

                </div>

              )}

            </button>



            {/* Stripe Option */}

            <button

              type="button"

              onClick={() => setPaymentMethod("stripe")}

              disabled={loading}

              className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${

                paymentMethod === "stripe"

                  ? "border-blue-600 bg-blue-50"

                  : "border-gray-200 hover:border-gray-300"

              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}

            >

              <CreditCard className="w-5 h-5 text-blue-600" />

              <div className="flex-1 text-left">

                <div className="font-semibold text-gray-900">Credit/Debit Card</div>

                <div className="text-xs text-gray-600">Pay securely with Stripe</div>

              </div>

              {paymentMethod === "stripe" && (

                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">

                  <div className="w-2 h-2 rounded-full bg-white"></div>

                </div>

              )}

            </button>

          </div>



          {/* Stripe Card Input */}

          {paymentMethod === "stripe" && (

            <div className="mb-6">

              <label className="block text-sm font-semibold text-gray-700 mb-2">

                Card Details

              </label>

              <div className="p-3 border-2 border-gray-300 rounded-lg focus-within:border-blue-600 transition-colors">

                <CardElement options={CARD_ELEMENT_OPTIONS} />

              </div>

              <p className="text-xs text-gray-500 mt-2">

                Test card: 4242 4242 4242 4242 | Any future date | Any CVC

              </p>

            </div>

          )}



          {/* Error Message */}

          {error && (

            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">

              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

              <p className="text-sm text-red-700">{error}</p>

            </div>

          )}



          {/* Action Buttons */}

          <div className="flex gap-3">

            <button

              type="button"

              onClick={onClose}

              disabled={loading}

              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

            >

              Cancel

            </button>

            <button

              onClick={handlePayment}

              disabled={loading || (paymentMethod === "stripe" && !stripe)}

              className="flex-1 px-4 py-2.5 text-white rounded-lg hover:opacity-90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

              style={{ backgroundColor: "#307B8E" }}

            >

              {loading ? (

                <span className="flex items-center justify-center gap-2">

                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

                  Processing...

                </span>

              ) : (

                `Pay $${amount.toFixed(2)}`

              )}

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}



// Main Component with Elements Provider

export default function VendorPaymentModal({ application, applicationType, onClose, onSuccess }) {

  return (

    <Elements stripe={stripePromise}>

      <PaymentForm

        application={application}

        applicationType={applicationType}

        onClose={onClose}

        onSuccess={onSuccess}

      />

    </Elements>

  );

}