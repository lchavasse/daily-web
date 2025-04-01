import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const webhookServerUrl = import.meta.env.VITE_WEBHOOK_SERVER_URL;

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${webhookServerUrl}/test/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        const expressCheckoutElement = elements.create('expressCheckout');
        expressCheckoutElement.mount('#express-checkout');
      })
      .catch((err) => setError(err.message));
  }, [elements]);

  const handleSubmit = async () => {
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    const result = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: window.location.origin + '/success',
      },
    });

    if (result.error) {
      setError(result.error.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <div id="express-checkout"></div>
      <button onClick={handleSubmit} disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Subscribe with 7-day Trial'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}

function SignUp() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

export default SignUp;