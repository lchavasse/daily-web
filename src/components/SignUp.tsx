import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentElement, useStripe, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
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
          // Use createSubscription to get client secret
          const result = await createSubscription(user?.name || '', user?.email || '');
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
      // Fonts are part of the appearance object in newer Stripe versions
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
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  
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

  // Initialize payment request button
  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'GB',
        currency: 'gbp',
        total: {
          label: 'daily. Subscription',
          amount: 500, // £5.00
        },
        requestPayerName: true,
        requestPayerEmail: true,
        // Add support for both browser and native payment methods
        requestShipping: false,
        disableWallets: ['browserCard'], // Don't show duplicate card option
      });

      // Check if the Payment Request is available
      pr.canMakePayment().then(result => {
        console.log('Payment Request availability:', result);
        if (result) {
          // Log which payment methods are available
          console.log('Available payment methods:', {
            applePay: result.applePay,
            googlePay: result.googlePay,
            browserPaymentMethods: result.browserPaymentMethods,
          });
          setPaymentRequest(pr);
        } else {
          console.log('No payment request methods available');
        }
      });

      // Handle payment method
      pr.on('paymentmethod', async (e) => {
        console.log('Payment method received:', e.paymentMethod.type);
        setProcessing(true);
        try {
          // Create subscription with the payment method details
          const result = await createSubscription(e.payerName, e.payerEmail);
          
          if (result?.clientSecret) {
            // Update user profile
            await updateUserProfile(e.payerName, e.payerEmail);
            
            // Confirm the payment
            if (result.isSetupIntent) {
              const { error } = await stripe.confirmSetup({
                elements,
                confirmParams: {
                  return_url: `${window.location.origin}/dashboard`,
                  payment_method: e.paymentMethod.id,
                },
              });

              if (error) {
                e.complete('fail');
                toast.error(error.message);
              } else {
                e.complete('success');
                toast.success('Setup successful!');
              }
            } else {
              const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                  return_url: `${window.location.origin}/dashboard`,
                  payment_method: e.paymentMethod.id,
                },
              });

              if (error) {
                e.complete('fail');
                toast.error(error.message);
              } else {
                e.complete('success');
                toast.success('Payment successful!');
              }
            }
          } else {
            e.complete('fail');
            toast.error('Failed to create subscription');
          }
        } catch (error) {
          console.error('Error processing payment:', error);
          e.complete('fail');
          toast.error('Payment failed. Please try again.');
        } finally {
          setProcessing(false);
        }
      });
    }
  }, [stripe, elements, navigate, createSubscription, updateUserProfile]);

  // Handle form submission
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
        {/* Apple Pay / Google Pay */}
        {paymentRequest && (
          <div className="overflow-visible">
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    type: 'buy',
                    theme: 'light',
                    height: '48px',
                  },
                },
              }}
            />
            <div className="mt-4 mb-2 text-center">
              <Separator>
                <span className="px-4 text-sm text-muted-foreground">or pay with card</span>
              </Separator>
            </div>
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
              ) : isSetupIntent ? 'Set Up Payment' : 'Pay Now'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignUp;
