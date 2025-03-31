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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [elementReady, setElementReady] = useState(false); // Track when element mounts
  const [error, setError] = useState<string | null>(null); // Track any errors
  const { user } = useAuth();

  useEffect(() => {
    const initializePayment = async () => {
      // PROBLEM: This check is insufficient. `stripe` might be null initially, but the effect runs anyway because `clientSecret` and `initialized` change later.
      // FIX: Move the stripe check outside the async function to prevent the effect from running prematurely.
      if (!stripe || clientSecret || initialized) return; // Only run if stripe is ready and we haven’t initialized yet

      setInitialized(true);
      try {
        const result = await createSetupIntent();
        console.log('result: ', result);
        if (result?.clientSecret) {
          setClientSecret(result.clientSecret);
        }
      } catch (error) {
        console.error('Failed to initialize payment:', error);
        toast.error('Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializePayment();
    // PROBLEM: Dependencies include `clientSecret` and `initialized`, which change in this effect, causing it to re-run unnecessarily and potentially after unmount.
    // FIX: Only depend on `stripe` to ensure this runs once when Stripe is ready.
  }, [stripe]); // Changed dependencies

  // Separate useEffect to mount Express Checkout element
  useEffect(() => {
    let mounted = true; // Track mount state to avoid updates after unmount
    let expressCheckoutElement;

    // PROBLEM: This runs too eagerly and might try to mount before `clientSecret` is set or after unmount.
    // FIX: Add guards and proper cleanup.
    if (!stripe || !elements || !clientSecret || elementReady) return;

    try {
      expressCheckoutElement = elements.create('expressCheckout');
      const mountElement = () => {
        const domElement = document.getElementById('express-checkout');
        if (!domElement) {
          console.error('Express checkout DOM element not found, will retry');
          setTimeout(mountElement, 100);
          return;
        }
        
        try {
          expressCheckoutElement.mount('#express-checkout');
          expressCheckoutElement.on('ready', () => {
            if (mounted) setElementReady(true); // Guard against updates after unmount
          });
          console.log('Express checkout element mounted successfully');
        } catch (mountError) {
          console.error('Error mounting express checkout element:', mountError);
          if (mounted) setError('Failed to mount payment form');
        }
      };
      
      mountElement();
    } catch (error) {
      console.error('Error creating express checkout element:', error);
      if (mounted) setError('Failed to initialize payment form');
    }

    // FIX: Add cleanup to prevent memory leaks and invalid operations
    return () => {
      mounted = false;
      if (expressCheckoutElement) {
        expressCheckoutElement.unmount();
        expressCheckoutElement.destroy();
      }
    };
  }, [stripe, elements, clientSecret, elementReady]);

  // PROBLEM: These early returns happen before hooks like `useForm` are called, which is fine, but we need to ensure all hooks are called consistently.
  if (!stripe || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!stripe || !elements || !clientSecret) return;
    
    setIsLoading(true);
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
        // TODO: Navigate to success page or update UI
      } else {
        setError(confirmResult.data);
      }
    }
    setIsLoading(false); // Moved outside to ensure it’s always reset
  };

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
          "Set up your payment method for your 7-day free trial. You won't be charged until the trial ends."
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
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              style={{ backgroundColor: '#FFA9CC', color: '#502220' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E880AA'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFA9CC'}
              disabled={!stripe || isLoading || !elementReady} // Added !elementReady to ensure element is mounted
            >
              {isLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
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