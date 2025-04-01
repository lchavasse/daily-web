import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// UI Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoaderCircle, ArrowLeft } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

// Details Form Component - to be shown initially
const DetailsForm: React.FC<{ onBackClick?: () => void }> = ({ onBackClick }) => {
  const { isLoading, createSubscription, updateUserProfile } = usePayment();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<z.infer<typeof formSchema>>({
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
    try {
      console.log('Creating subscription with data:', data);
      const result = await createSubscription(data.name, data.email);
      console.log('Subscription creation result:', result);
      
      if (result) {
        // Also update user profile
        await updateUserProfile(data.name, data.email);
      }

      user.name = data.name; // Update user name in local context

    } catch (error) {
      console.error('Error during sign up:', error);
      toast.error('Failed to process your information');
    }
  };

  return (
    <Card className="w-full daily-card-contrast relative max-h-[90vh] md:max-h-[90vh] overflow-auto">
      {/* Back button at top right */}
      {onBackClick && (
        <button 
          onClick={onBackClick}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors z-10"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      
      <CardHeader>
        <CardTitle>Subscribe to daily.</CardTitle>
        <CardDescription>
          Get unlimited access to daily. with our monthly subscription.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 mt-0">
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
            
            <Button 
              type="submit" 
              className="w-full" 
              style={{ backgroundColor: '#FFA9CC', color: '#502220' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E880AA'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFA9CC'}
              disabled={isLoading}
            >
              {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Continue to Payment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// SignUp form component (within Elements)
const SignUpForm: React.FC<{ onBackClick?: () => void }> = ({ onBackClick }) => {
  const { stripe: stripeInstance, clientSecret } = usePayment();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // For a subscription in progress, we only need to show the payment form
  console.log('StripePaymentForm rendering with clientSecret:', clientSecret);
  
  // Function to handle cancellation and return to details
  const handleCancel = () => {
    // Navigate back to the details form
    // This will trigger a re-render of the parent SignUp component
    navigate(0); // Refresh the page
  };
  
  return (
    <Card className="w-full daily-card-contrast relative max-h-[100vh] md:max-h-[90vh] overflow-auto">
      {/* Back button at top right */}
      {onBackClick && (
        <button 
          onClick={onBackClick}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors z-10"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      
      <CardHeader>
        <CardTitle>Subscribe to Daily</CardTitle>
        <CardDescription className="flex justify-between items-center">
          <span>Complete your payment to subscribe to daily.</span>
          {/*
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          */}
        </CardDescription>
      </CardHeader>
      
      {clientSecret ? (
        <StripePaymentForm clientSecret={clientSecret} />
      ) : (
        <CardContent className="space-y-4 pt-4">
          <div className="p-4 text-center">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p>Preparing payment form...</p>
            <p className="text-sm text-muted-foreground mt-2">
              If this takes more than a few seconds, please go back and try again.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Stripe Payment Form (used inside Elements)
const StripePaymentForm: React.FC<{ clientSecret: string }> = ({ clientSecret }) => {
  console.log('StripePaymentForm initialized with clientSecret:', clientSecret);
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<any>(null);
  const { user, setAccount } = useAuth();

  useEffect(() => {
    if (!stripe || !elements) {
      console.log('Stripe or Elements not available yet');
      return;
    }
    
    console.log('Stripe and Elements are ready');
    
    // Add an event listener for stripe errors
    const checkElements = async () => {
      try {
        // This will validate that the Elements instance can be created properly
        const element = elements.getElement(PaymentElement);
        if (!element) {
          console.log('PaymentElement not mounted yet');
        } else {
          console.log('PaymentElement mounted successfully');
        }
      } catch (error) {
        console.error('Error checking elements:', error);
        setStripeError(error);
        setMessage('Error loading payment form. Please refresh and try again.');
      }
    };
    
    checkElements();
  }, [stripe, elements]);
  
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      console.error('Stripe or elements not initialized');
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      console.log('Confirming payment with clientSecret:', clientSecret);
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment_success=true`,
        },
        redirect: 'if_required',
      });
      
      if (error) {
        console.error('Payment error:', error);
        setMessage(error.message || 'An error occurred');
        return;
      }
      
      if (setupIntent && setupIntent.status === 'succeeded') {
        console.log('Payment successful');
        setAccount('closed')
        navigate('/dashboard');
      } else {
        setMessage('Payment processing');
      }
    } catch (error: any) {
      console.error('Exception during payment:', error);
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);

    }
  };
  
  return (
    <form onSubmit={handlePaymentSubmit} className="pb-8 md:pb-0">
      <CardContent className="space-y-4 pt-4">
        <div className="mb-4">
          <h3 className="font-medium mb-1">Subscription Details</h3>
          <p className="text-sm text-muted-foreground">Monthly subscription - £5/month</p>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-4">
          {stripeError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
              <h4 className="font-medium mb-2">Payment Error</h4>
              <p className="text-sm mb-2">There was an error setting up the payment form.</p>
              <p className="text-xs">Error: {stripeError.message || 'Unknown error'}</p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Refresh Page
              </Button>
            </div>
          ) : (
            <PaymentElement />
          )}
          
          {message && !stripeError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {message}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button type="submit" disabled={loading || !stripe || !elements || !!stripeError}>
          {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Pay Now
        </Button>
      </CardFooter>
    </form>
  );
};


// Wrapper component with Stripe Elements
export const SignUp: React.FC<{ onBackClick?: () => void }> = ({ onBackClick }) => {
  const { stripe, clientSecret } = usePayment();
  
  if (!stripe) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Show details form when no client secret is available yet
  if (!clientSecret) {
    return <DetailsForm onBackClick={onBackClick} />;
  }
  
  // When client secret is available, render the Elements with payment form
  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      <SignUpForm onBackClick={onBackClick} />
    </Elements>
  );
};

export default SignUp;