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

const { stripePromise } = usePayment();

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
      if (stripe && !clientSecret && !initialized) {
        setInitialized(true);
        try {
          // Use createSubscription with just the name, making email optional
          // The server will use the user_id to get the email if available
          const result = await createSetupIntent();
          if (result?.clientSecret) {
            setClientSecret(result.clientSecret);
            const expressCheckoutElement = elements.create('expressCheckout');
            expressCheckoutElement.mount('#express-checkout');
            expressCheckoutElement.on('ready', () => setElementReady(true)); // Confirm it’s loaded
          }
        } catch (error) {
          console.error('Failed to initialize payment:', error);
          toast.error('Failed to initialize payment');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    initializePayment();
  }, [stripe, clientSecret, initialized, user, elements]);
  
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

  // Update form values if user changes
  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email);
    }
  }, [user, setValue]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!stripe || !elements || !clientSecret) return;
    
    setIsLoading(true);
    const result = await stripe.confirmSetup({
      elements,
      clientSecret,
      confirmParams: {
        return_url: window.location.origin + '/success', // Temporary redirect (won’t be used)
      },
      redirect: 'if_required', // Prevent redirect unless necessary
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      // Payment method confirmed, now create subscription
      const paymentMethodId = result.setupIntent.payment_method;
      const confirmResult = await confirmSetupIntent(paymentMethodId as string);
      if (confirmResult.success) {
        console.log('Subscription created:', confirmResult.data.subscriptionId);
      } else {
        setError(confirmResult.data);
      }
      setIsLoading(false);
    }
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

        {/* Card Payment Form */}
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

            {/* Express Checkout Element Container */}
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
              disabled={!stripe || isLoading}
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
      // Fonts are part of the appearance object in newer Stripe versions
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
