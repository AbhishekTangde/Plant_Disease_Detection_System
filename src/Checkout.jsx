import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Public Stripe test key
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

function CheckoutForm({ cartTotal, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cartTotal })
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setProcessing(false);
        return;
      }

      // Simulate the confirmation process since we are in test mode and might not want real card entry checks.
      // But we can just use the confirmCardPayment
      const payload = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      });

      if (payload.error) {
        setError(payload.error.message);
        setProcessing(false);
      } else {
        setProcessing(false);
        onSuccess();
      }
    } catch (e) {
      setError("Payment failed: " + e.message);
      setProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: "#1a2e22",
        fontFamily: "'Nunito', sans-serif",
        fontSmoothing: "antialiased",
        fontSize: "15px",
        "::placeholder": { color: "#aab7c4" }
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a"
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <div style={{ marginBottom: 20, border: "1px solid var(--bd)", padding: "14px", borderRadius: "10px", background: "var(--bg)" }}>
        <CardElement options={cardStyle} />
      </div>
      {error && <div style={{ color: "#fa755a", marginBottom: 14, fontSize: 13, fontWeight: 700 }}>{error}</div>}
      
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" disabled={!stripe || processing} style={{ flex: 1, padding: "12px", background: processing ? "var(--mu)" : "var(--g1)", color: "#fff", border: "none", borderRadius: 40, fontWeight: 800, fontSize: 14, cursor: processing ? "not-allowed" : "pointer" }}>
          {processing ? "Processing..." : `Pay ₹${cartTotal}`}
        </button>
        <button type="button" onClick={onClose} disabled={processing} style={{ padding: "12px 24px", background: "transparent", color: "var(--text)", border: "1px solid var(--bd)", borderRadius: 40, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
      <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "var(--mu)", fontWeight: 700 }}>🔒 Secure payment powered by Stripe</div>
    </form>
  );
}

export default function CheckoutModal({ cartTotal, onSuccess, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", width: "100%", maxWidth: 440, borderRadius: "20px", padding: "30px", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
          <h2 style={{ fontFamily: "'Baloo 2',cursive", color: "var(--g1)", fontSize: 24, margin: 0 }}>Secure Checkout</h2>
          <p style={{ color: "var(--mu)", fontSize: 13, margin: "4px 0 0" }}>Complete your payment to place the order.</p>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px dashed var(--bd)", fontWeight: 800, fontSize: 18, color: "var(--text)" }}>
          <span>Total Amount</span>
          <span style={{ color: "var(--g1)" }}>₹{cartTotal}</span>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm cartTotal={cartTotal} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </div>
    </div>
  );
}
