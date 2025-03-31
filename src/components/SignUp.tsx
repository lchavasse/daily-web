import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
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

// Custom hook to mount Stripe elements safely
const useMountStripeElement = (stripe, elements, clientSecret, elementType, selector, onReady) => {
  const [mounted, setMounted] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!stripe || !elements || !clientSecret || mounted || !elementRef.current) return;

    let intervalId;
    const mountElement = () => {
      const domElement = document.querySelector(selector);
      if (!domElement) {
        console.log(`Waiting for ${selector} to appear in DOM...`);
        return;
      }

      try {
        const element = elements.create(elementType, elementType === 'expressCheckout' ? {
          buttonTheme: { googlePay: 'black', applePay: 'white' },
        } : {
          fields: { billingDetails: { name: 'never', email: 'never' } },
        });
        console.log(`Mounting ${elementType} to ${selector}`);
        element.mount(selector);
        element.on('ready', () => {
          console.log(`${elementType} ready`);
          setMounted(true);
          onReady();
          clearInterval(intervalId); // Stop checking once mounted
        });

        return () => {
          console.log(`Unmounting ${elementType}`);
          element.unmount();
        };
      } catch (error) {
        console.error(`Error mounting ${elementType}:`, error);
      }
    };

    intervalId = setInterval(mountElement, 100); // Check every 100ms

    return () => {
      clearInterval(intervalId);
    };
  }, [stripe, elements, clientSecret, elementType, selector, mounted, onReady]);

  return { mounted, elementRef };
};

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

  const { mounted: expressReady, elementRef: expressRef } = useMountStripeElement(
    stripe,
    elements,
    clientSecret,
    'expressCheckout',
    '#express-checkout',
    () => setIsLoading(false)
  );
  const { mounted: cardReady, elementRef: cardRef } = useMountStripeElement(
    stripe,
    elements,
    clientSecret,
    'payment',
    '#payment-element',
    () => {}
  );

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<z.infer<typeof formSchema>>({
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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!stripe || !elements || !clientSecret) return;

    setIsLoading(true);

    const result = await stripe.confirmSetup({
      elements,
      clientSecret,
      confirmParams: {
        return_url: window.location.origin + '/success',
        ...(useCard && {
          payment_method_data: {
            billing_details: {
              name: data.name,
              email: data.email,
            },
          },
        }),
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message);
      setIsLoading(false);
    } else {
      const paymentMethodId = result.setupIntent.payment_method;
      try {
        const confirmResult = await confirmSetupIntent(paymentMethodId as string, data.name, data.email);
        if (confirmResult.success) {
          console.log('Subscription created:', confirmResult.data.subscriptionId);
          handleUserDetails(
            useCard ? data.name : confirmResult.data.name,
            useCard ? data.email : confirmResult.data.email
          );
          navigate('/success');
        } else {
          setError(confirmResult.data);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
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
              <div id="express-checkout" ref={expressRef} style={{ minHeight: '50px' }}></div>
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
                <div id="payment-element" ref={cardRef} style={{ minHeight: '50px' }}></div>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              className="w-full mt-6"
              style={{ backgroundColor: '#FFA9CC', color: '#502220' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#E880AA')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFA9CC')}
              disabled={!stripe || isLoading || (!expressReady && !cardReady)}
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