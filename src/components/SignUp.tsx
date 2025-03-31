import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// UI Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoaderCircle, ArrowLeft } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

// Combined Payment Form Component
const PaymentForm: React.FC<{ onBackClick?: () => void; isSetupIntent?: boolean }> = ({ onBackClick, isSetupIntent = false }) => {
  const { createSetupIntent, confirmSetupIntent } = usePayment();
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Always call useForm at the top level, no matter what the component will render
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
    },
  });

  // Effect to update form values when user changes
  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email);
    }
  }, [user, setValue]);

  // Initialize payment - get client secret
  useEffect(() => {
    let isMounted = true;
    
    const initializePayment = async () => {
      if (!stripe || initialized) return;
      
      console.log('Initializing payment process...');
      setInitialized(true);
      try {
        console.log('Calling createSetupIntent...');
        const result = await createSetupIntent();
        console.log('Setup intent result:', result);
        if (result?.clientSecret && isMounted) {
          console.log('Setting client secret...');
          setClientSecret(result.clientSecret);
        } else {
          console.error('No client secret received or component unmounted');
          if (isMounted) {
            setError('Failed to initialize payment');
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to initialize payment:', error);
        if (isMounted) {
          toast.error('Failed to initialize payment');
          setError('Failed to initialize payment');
          setIsLoading(false);
        }
      } finally {
        if (isMounted) {
          console.log('Finishing initialization, setting loading to false');
          setIsLoading(false);
        }
      }
    };
    
    if (stripe && !initialized) {
      console.log('Stripe is available, starting initialization');
      initializePayment();
    }
    
    return () => {
      console.log('Payment initialization effect cleanup');
      isMounted = false;
    };
  }, [stripe, createSetupIntent, initialized]);

  // Mount Express Checkout element
  useEffect(() => {
    console.log('Express checkout mounting effect triggered', {
      stripe: !!stripe,
      elements: !!elements,
      clientSecret: !!clientSecret,
      elementReady
    });
    
    let isMounted = true;
    let expressCheckoutElement;
    
    const mountElement = () => {
      if (!stripe || !elements || !clientSecret || elementReady || !isMounted) {
        console.log('Cannot mount element yet:', {
          stripe: !!stripe,
          elements: !!elements,
          clientSecret: !!clientSecret,
          elementReady,
          isMounted
        });
        return;
      }
      
      try {
        const domElement = document.getElementById('express-checkout');
        if (!domElement) {
          console.log('DOM element not found, will retry in 100ms');
          setTimeout(mountElement, 100);
          return;
        }
        
        console.log('DOM element found, creating ExpressCheckout element');
        
        // Only create the element if we haven't already
        if (!expressCheckoutElement && elements) {
          try {
            console.log('Creating express checkout element');
            expressCheckoutElement = elements.create('expressCheckout');
            console.log('Successfully created express checkout element');
          } catch (createError) {
            console.error('Error creating express checkout element:', createError);
            if (isMounted) {
              setError('Failed to create payment form');
              setElementReady(false); // Ensure we don't get stuck
            }
            return;
          }
        }
        
        try {
          console.log('Mounting express checkout element');
          expressCheckoutElement.mount('#express-checkout');
          console.log('Express checkout element mounted, setting up ready event');
          
          expressCheckoutElement.on('ready', () => {
            console.log('Express checkout element ready event fired');
            if (isMounted) {
              setElementReady(true);
              console.log('Element ready state set to true');
            }
          });
        } catch (mountError) {
          console.error('Error mounting express checkout element:', mountError);
          if (isMounted) {
            setError('Failed to mount payment form');
            // Try to recover by forcing the loading state to end
            setElementReady(false);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Unexpected error in mountElement:', error);
        if (isMounted) {
          setError('An unexpected error occurred');
          // Ensure we're not stuck in loading state
          setIsLoading(false);
        }
      }
    };
    
    if (stripe && elements && clientSecret && !elementReady) {
      console.log('All prerequisites met, attempting to mount element');
      // Add small delay to ensure DOM is ready
      setTimeout(mountElement, 50);
    }
    
    return () => {
      console.log('Express checkout effect cleanup');
      isMounted = false;
      if (expressCheckoutElement) {
        try {
          console.log('Unmounting express checkout element');
          expressCheckoutElement.unmount();
        } catch (e) {
          console.error('Error unmounting element:', e);
        }
      }
    };
  }, [stripe, elements, clientSecret, elementReady]);

  // Add an escape hatch for infinite loading
  useEffect(() => {
    let timeoutId;
    
    if (clientSecret && !elementReady && isLoading) {
      console.log('Setting up loading timeout safety');
      timeoutId = setTimeout(() => {
        console.log('Loading timeout triggered - forcing loading to end');
        setIsLoading(false);
        setError('Payment form took too long to load. You can try reloading the page.');
      }, 10000); // 10 second timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [clientSecret, elementReady, isLoading]);

  // Form submission handler
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!stripe || !elements || !clientSecret) return;
    
    setIsLoading(true);
    try {
      const result = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.origin + '/success',
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        const paymentMethodId = result.setupIntent.payment_method;
        const confirmResult = await confirmSetupIntent(paymentMethodId as string);
        if (confirmResult.success) {
          console.log('Subscription created:', confirmResult.data.subscriptionId);
          // Success handling here
        } else {
          setError(confirmResult.data);
        }
      }
    } catch (submitError) {
      console.error('Error during submission:', submitError);
      setError('An unexpected error occurred during payment submission');
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state
  if (!stripe || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading payment form...</p>
          {clientSecret && !elementReady && (
            <Button 
              className="mt-4" 
              variant="outline" 
              onClick={() => setIsLoading(false)}
            >
              Continue anyway
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Render error state if client secret couldn't be obtained
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

  // Render the main form
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
          Set up your payment method for your 7-day free trial. You won't be charged until the trial ends.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 overflow-visible">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-visible">
          <div className="space-y-4 overflow-visible">
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

            <div style={{ marginBottom: '20px' }}>
              {!elementReady && !error && <p>Loading payment options...</p>}
              <div id="express-checkout" style={{ minHeight: '50px' }}></div>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              style={{ backgroundColor: '#FFA9CC', color: '#502220' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E880AA'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFA9CC'}
              disabled={!stripe || isLoading || !elementReady}
            >
              {isLoading ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : 'Subscribe'}
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
    <Elements stripe={stripePromise} options={{ 
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
            padding: '8px 16px'
          },
          '.TabIcon': {
            marginRight: '8px'
          }
        }
      },
      loader: 'auto',
      fonts: [
        {
          cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
        },
      ]
    }}>
      <PaymentForm onBackClick={onBackClick} />
    </Elements>
  );
};

export default SignUp;