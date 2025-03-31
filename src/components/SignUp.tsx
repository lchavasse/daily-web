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
      
      setInitialized(true);
      try {
        const result = await createSetupIntent();
        console.log('result: ', result);
        if (result?.clientSecret && isMounted) {
          setClientSecret(result.clientSecret);
        }
      } catch (error) {
        console.error('Failed to initialize payment:', error);
        if (isMounted) {
          toast.error('Failed to initialize payment');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializePayment();
    
    return () => {
      isMounted = false;
    };
  }, [stripe, createSetupIntent, initialized]);

  // Mount Express Checkout element
  useEffect(() => {
    let isMounted = true;
    let expressCheckoutElement;
    
    const mountElement = () => {
      if (!stripe || !elements || !clientSecret || elementReady || !isMounted) return;
      
      try {
        const domElement = document.getElementById('express-checkout');
        if (!domElement) {
          // Try again in a bit if the DOM element isn't ready
          setTimeout(mountElement, 100);
          return;
        }
        
        // Only create the element if we haven't already
        if (!expressCheckoutElement && elements) {
          try {
            expressCheckoutElement = elements.create('expressCheckout');
          } catch (createError) {
            console.error('Error creating express checkout element:', createError);
            if (isMounted) setError('Failed to create payment form');
            return;
          }
        }
        
        try {
          expressCheckoutElement.mount('#express-checkout');
          expressCheckoutElement.on('ready', () => {
            if (isMounted) setElementReady(true);
          });
          console.log('Express checkout element mounted successfully');
        } catch (mountError) {
          console.error('Error mounting express checkout element:', mountError);
          if (isMounted) setError('Failed to mount payment form');
        }
      } catch (error) {
        console.error('Unexpected error in mountElement:', error);
        if (isMounted) setError('An unexpected error occurred');
      }
    };
    
    if (stripe && elements && clientSecret && !elementReady) {
      mountElement();
    }
    
    return () => {
      isMounted = false;
      if (expressCheckoutElement) {
        try {
          expressCheckoutElement.unmount();
        } catch (e) {
          console.error('Error unmounting element:', e);
        }
      }
    };
  }, [stripe, elements, clientSecret, elementReady]);

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
        <LoaderCircle className="h-8 w-8 animate-spin" />
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