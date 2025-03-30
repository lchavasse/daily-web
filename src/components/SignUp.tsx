import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Elements, ExpressCheckoutElement, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
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

// Wrapper component with Stripe Elements
export const SignUp: React.FC<{ onBackClick?: () => void }> = ({ onBackClick }) => {
  const { stripe, createSubscription } = usePayment();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSetupIntent, setIsSetupIntent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const initializePayment = async () => {
      if (stripe && !clientSecret && !initialized) {
        setInitialized(true);
        try {
          // Use createSubscription with just the name, making email optional
          // The server will use the user_id to get the email if available
          const result = await createSubscription(user?.name || '');
          if (result?.clientSecret) {
            setClientSecret(result.clientSecret);
            setIsSetupIntent(result.isSetupIntent || false);
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
  }, [stripe, clientSecret, initialized, createSubscription, user]);
  
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
  
  // Updated Elements configuration according to migration guide
  return (
    <Elements stripe={stripe} options={{ 
      clientSecret,
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
      <PaymentForm onBackClick={onBackClick} isSetupIntent={isSetupIntent} />
    </Elements>
  );
};


// Combined Payment Form Component
const PaymentForm: React.FC<{ onBackClick?: () => void; isSetupIntent?: boolean }> = ({ onBackClick, isSetupIntent = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { isLoading, createSubscription, updateUserProfile } = usePayment();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showExpressCheckout, setShowExpressCheckout] = useState(true);
  const [processing, setProcessing] = useState(false);
  const expressCheckoutRef = React.useRef<HTMLDivElement>(null);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Update form values if user changes
  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email);
    }
    if (user?.name) {
      setValue('name', user.name);
    }
  }, [user, setValue]);

  // Initialize elements with proper mode, amount, and currency
  useEffect(() => {
    if (elements) {
      elements.update({
        mode: 'payment',
        amount: 500, // £5.00
        currency: 'gbp',
      });
    }
  }, [elements]);

  // Mount Express Checkout Element imperatively
  useEffect(() => {
    if (!stripe || !elements || !expressCheckoutRef.current) return;

    // Clean up any previous elements
    expressCheckoutRef.current.innerHTML = '';

    try {
      // Create Express Checkout Element
      const expressCheckoutElement = elements.create('expressCheckout', {
        buttonType: {
          applePay: 'buy',
          googlePay: 'buy',
          paypal: 'checkout',
        },
        business: {
          name: 'daily.',
        },
        emailRequired: true
      });

      // Mount the element
      expressCheckoutElement.mount(expressCheckoutRef.current);

      // Add event listeners
      expressCheckoutElement.on('ready', (event) => {
        console.log('Express Checkout ready:', event);
        // If no payment methods are available, hide the express checkout section
        if (!event.availablePaymentMethods || 
            Object.keys(event.availablePaymentMethods).length === 0) {
          setShowExpressCheckout(false);
        }
      });

      expressCheckoutElement.on('confirm', async (event: any) => {
        if (!stripe || !elements) return;
        
        setProcessing(true);
        try {
          // Get user details from Express Checkout if available
          const userName = event.payerName || user?.name || '';
          const userEmail = event.payerEmail || user?.email || '';
          
          // Update user profile if we have the data
          if (userName || userEmail) {
            await updateUserProfile(userName, userEmail);
          }
          
          // Check if this is a SetupIntent or PaymentIntent and call appropriate method
          if (isSetupIntent) {
            console.log('Using confirmSetup for trial subscription');
            // For free trial, we use SetupIntent
            const { error } = await stripe.confirmSetup({
              elements,
              confirmParams: {
                return_url: `${window.location.origin}/dashboard`,
              },
              redirect: 'if_required',
            });
            
            if (error) {
              console.error('Setup confirmation error:', error);
              toast.error(error.message || 'Setup failed');
              // Call complete if it exists
              if (typeof event.complete === 'function') {
                event.complete('fail');
              }
            } else {
              toast.success('Free trial setup successful!');
              // Call complete if it exists
              if (typeof event.complete === 'function') {
                event.complete('success');
              }
              // Navigate to dashboard on success if not redirected
              navigate('/dashboard');
            }
          } else {
            console.log('Using confirmPayment for regular subscription');
            // For regular payment, we use PaymentIntent
            const { error } = await stripe.confirmPayment({
              elements,
              confirmParams: {
                return_url: `${window.location.origin}/dashboard`,
              },
              redirect: 'if_required',
            });
            
            if (error) {
              console.error('Payment confirmation error:', error);
              toast.error(error.message || 'Payment failed');
              // Call complete if it exists
              if (typeof event.complete === 'function') {
                event.complete('fail');
              }
            } else {
              toast.success('Payment successful!');
              // Call complete if it exists
              if (typeof event.complete === 'function') {
                event.complete('success');
              }
              // Navigate to dashboard on success if not redirected
              navigate('/dashboard');
            }
          }
        } catch (error) {
          console.error('Error processing Express Checkout:', error);
          toast.error('Payment failed. Please try again.');
          // Call complete if it exists
          if (typeof event.complete === 'function') {
            event.complete('fail');
          }
        } finally {
          setProcessing(false);
        }
      });

      // Return cleanup function
      return () => {
        expressCheckoutElement.unmount();
      };
    } catch (error) {
      console.error('Error creating Express Checkout Element:', error);
      setShowExpressCheckout(false);
    }
  }, [stripe, elements, user, navigate, updateUserProfile, isSetupIntent]);

  // Handle form submission for card payments
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!stripe || !elements) return;
    
    setProcessing(true);
    try {
      // Update user profile first
      await updateUserProfile(data.name, data.email);
      
      // Confirm the payment or setup based on intent type
      if (isSetupIntent) {
        const { error } = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard`,
            payment_method_data: {
              billing_details: {
                name: data.name,
                email: data.email,
              }
            }
          },
        });

        if (error) {
          toast.error(error.message);
        }
      } else {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard`,
            payment_method_data: {
              billing_details: {
                name: data.name,
                email: data.email,
              }
            }
          },
        });

        if (error) {
          toast.error(error.message);
        }
      }
    } catch (error) {
      console.error('Error during payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessing(false);
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
          {isSetupIntent 
            ? "Set up your payment method for your 7-day free trial. You won't be charged until the trial ends."
            : "Get unlimited access to daily. with our monthly subscription."}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 overflow-visible">
        {/* Express Checkout Element (replaces Payment Request Button) */}
        {showExpressCheckout && (
          <div className="overflow-visible">
            <div ref={expressCheckoutRef} id="express-checkout-element" className="mb-4"></div>
            {showExpressCheckout && (
              <div className="mt-4 mb-2 text-center">
                <Separator>
                  <span className="px-4 text-sm text-muted-foreground">or pay with card</span>
                </Separator>
              </div>
            )}
          </div>
        )}

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

            <div className="payment-element-container overflow-visible">
              <PaymentElement options={{
                layout: {
                  type: 'accordion',
                  defaultCollapsed: false,
                  radios: false,
                  spacedAccordionItems: false
                }
              }} />
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              style={{ backgroundColor: '#FFA9CC', color: '#502220' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E880AA'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFA9CC'}
              disabled={!stripe || isLoading || processing}
            >
              {(isLoading || processing) ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : isSetupIntent ? 'Sign up for trial' : 'Subscribe'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignUp;
