import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Elements, useStripe, useElements, ExpressCheckoutElement, PaymentElement } from '@stripe/react-stripe-js';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// UI Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, ArrowLeft } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

// Combined Payment Form Component
const PaymentForm: React.FC<{ onBackClick?: () => void }> = ({ onBackClick }) => {
  const { createSetupIntent, confirmSetupIntent } = usePayment();
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useCard, setUseCard] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, getValues } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
    },
  });

  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email);
    }
  }, [user, setValue]);

  useEffect(() => {
    let isMounted = true;

    const initializePayment = async () => {
      if (!stripe) return;

      try {
        console.log('Creating setup intent');
        const result = await createSetupIntent();
        if (result?.clientSecret && isMounted) {
          console.log('Client secret received:', result.clientSecret);
          setClientSecret(result.clientSecret);
          setIsLoading(false);
        } else {
          setError('Failed to initialize payment');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize payment:', error);
        if (isMounted) {
          toast.error('Failed to initialize payment');
          setError('Failed to initialize payment');
          setIsLoading(false);
        }
      }
    };

    if (stripe) {
      initializePayment();
    }

    return () => {
      isMounted = false;
    };
  }, [stripe, createSetupIntent]);

  const handleExpressCheckoutConfirm = async (event) => {
    if (!stripe || !elements || !clientSecret) return;

    setIsLoading(true);
    console.log('Confirming Express Checkout SetupIntent');
    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      clientSecret,
      confirmParams: {
        return_url: window.location.origin + '/success',
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      console.error('Express Checkout confirmation failed:', confirmError);
      setError(confirmError.message);
      setIsLoading(false);
    } else if (setupIntent && setupIntent.status === 'succeeded') {
      console.log('SetupIntent succeeded:', setupIntent.id);
      await confirmSubscription(setupIntent.payment_method);
    } else {
      setError('SetupIntent confirmation incomplete');
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!stripe || !elements || !clientSecret) return;

    setIsLoading(true);
    console.log('Confirming Card SetupIntent');
    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      clientSecret,
      confirmParams: {
        return_url: window.location.origin + '/success',
        payment_method_data: {
          billing_details: {
            name: data.name,
            email: data.email,
          },
        },
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      console.error('Card confirmation failed:', confirmError);
      setError(confirmError.message);
      setIsLoading(false);
    } else if (setupIntent && setupIntent.status === 'succeeded') {
      console.log('SetupIntent succeeded:', setupIntent.id);
      await confirmSubscription(setupIntent.payment_method);
    } else {
      setError('SetupIntent confirmation incomplete');
      setIsLoading(false);
    }
  };

  const confirmSubscription = async (paymentMethodId) => {
    if (!paymentMethodId) {
      setError('No payment method ID provided');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Confirming subscription with paymentMethodId:', paymentMethodId);
      const confirmResult = await confirmSetupIntent(paymentMethodId, {
        name: useCard ? getValues('name') : undefined,
        email: useCard ? getValues('email') : undefined,
      });
      if (confirmResult.success) {
        console.log('Subscription created:', confirmResult.data.subscriptionId);
        handleUserDetails(
          useCard ? getValues('name') : confirmResult.data.name,
          useCard ? getValues('email') : confirmResult.data.email
        );
        navigate('/success');
      } else {
        setError(confirmResult.data || 'Failed to create subscription');
      }
    } catch (err) {
      console.error('Subscription confirmation error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserDetails = (name: string, email: string) => {
    console.log('User Details:', { name, email });
    // Add your logic here
  };

  if (!stripe || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading payment form...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-red-500">Failed to initialize payment form</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full daily-card-contrast relative payment-card">
      {onBackClick && (
        <button
          onClick={onBackClick}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <CardHeader>
        <CardTitle>Subscribe to daily.</CardTitle>
        <CardDescription>
          Set up your payment method for your 7-day free trial. You won’t be charged until the trial ends.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 overflow-visible">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-visible">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Label className="flex items-center">
                <input
                  type="radio"
                  checked={!useCard}
                  onChange={() => setUseCard(false)}
                  disabled={isLoading}
                  className="mr-2"
                />
                Google Pay / Apple Pay
              </Label>
              <Label className="flex items-center">
                <input
                  type="radio"
                  checked={useCard}
                  onChange={() => setUseCard(true)}
                  disabled={isLoading}
                  className="mr-2"
                />
                Card
              </Label>
            </div>

            <div style={{ display: useCard ? 'none' : 'block' }}>
              <ExpressCheckoutElement
                options={{
                  buttonTheme: { googlePay: 'black', applePay: 'white' },
                }}
                onConfirm={handleExpressCheckoutConfirm}
              />
            </div>

            {useCard && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="name"
                    className="daily-input"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="email"
                    type="email"
                    className="daily-input"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                <PaymentElement />
                <Button
                  type="submit"
                  className="w-full mt-6"
                  style={{ backgroundColor: '#FFA9CC', color: '#502220' }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#E880AA')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFA9CC')}
                  disabled={!stripe || isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Wrapper component with Stripe Elements
export const SignUp: React.FC<{ onBackClick?: () => void }> = ({ onBackClick }) => {
  const { stripePromise } = usePayment();

  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#FFA9CC',
            colorBackground: '#ffffff',
            colorText: '#000000',
            colorDanger: '#df1b41',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
          rules: {
            '.Input': {
              borderWidth: '1px',
            },
            '.Tab': {
              padding: '8px 16px',
            },
            '.TabIcon': {
              marginRight: '8px',
            },
          },
        },
        loader: 'auto',
        fonts: [
          {
            cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
          },
        ],
      }}
    >
      <PaymentForm onBackClick={onBackClick} />
    </Elements>
  );
};

export default SignUp;