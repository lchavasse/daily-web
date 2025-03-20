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

// Combined Payment Form Component
const PaymentForm: React.FC<{ onBackClick?: () => void }> = ({ onBackClick }) => {
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
      });

      // Check if the Payment Request is available
      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
        }
      });

      // Handle payment method
      pr.on('paymentmethod', async (e) => {
        setProcessing(true);
        try {
          // Create subscription with the payment method details
          const result = await createSubscription(e.payerName, e.payerEmail);
          
          if (result) {
            // Update user profile
            await updateUserProfile(e.payerName, e.payerEmail);
            
            // Confirm the payment
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
      // First create the subscription
      const result = await createSubscription(data.name, data.email);
      
      if (result) {
        // Update user profile
        await updateUserProfile(data.name, data.email);
        
        // Then confirm the payment
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard`,
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
    <Card className="w-full daily-card-contrast relative">
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
          Get unlimited access to daily. with our monthly subscription.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Apple Pay / Google Pay */}
        {paymentRequest && (
          <div>
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    type: 'default',
                    theme: 'dark',
                    height: '44px',
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E880AA'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFA9CC'}
              disabled={!stripe || isLoading || processing}
            >
              {(isLoading || processing) ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : 'Pay Now'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Wrapper component with Stripe Elements
export const SignUp: React.FC<{ onBackClick?: () => void }> = ({ onBackClick }) => {
  const { stripe, clientSecret } = usePayment();
  
  if (!stripe || !clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      <PaymentForm onBackClick={onBackClick} />
    </Elements>
  );
};

export default SignUp;
