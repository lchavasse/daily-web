import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Environment variables
const webhookServerUrl = import.meta.env.VITE_WEBHOOK_SERVER_URL as string;
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

interface PaymentContextType {
  isLoading: boolean;
  subscriptionStatus: string | null;
  subscriptionId: string | null;
  currentPeriodEnd: number | null;
  clientSecret: string | null;
  stripe: Stripe | null;
  createSubscription: (name: string, email: string) => Promise<{ clientSecret: string } | null>;
  updateUserProfile: (name: string, email: string) => Promise<boolean>;
  refreshSubscriptionStatus: () => Promise<void>;
  clearPaymentState: () => void;
  cancelSubscription: () => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setAccount } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);

  // Initialize Stripe
  useEffect(() => {
    const initializeStripe = async () => {
      if (!stripePublishableKey) {
        console.error('Stripe publishable key not found');
        return;
      }

      try {
        // Reduced logging
        const stripeInstance = await loadStripe(stripePublishableKey);
        if (stripeInstance) {
          setStripe(stripeInstance);
        } else {
          console.error('Stripe initialized but returned null instance');
        }
      } catch (error) {
        console.error('Error initializing Stripe:', error);
      }
    };

    initializeStripe();
  }, []);

  // Refresh subscription status - wrapped in useCallback to maintain reference
  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${webhookServerUrl}/api/stripe/subscription-status?user_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      
      const data = await response.json();
      setSubscriptionStatus(data.status);
      setSubscriptionId(data.subscription_id || null);
      setCurrentPeriodEnd(data.current_period_end || null);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      toast.error('Failed to fetch subscription status');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Check subscription status when user changes
  useEffect(() => {
    if (user?.id) {
      refreshSubscriptionStatus();
    } else {
      // Reset subscription data if no user
      setSubscriptionStatus(null);
      setSubscriptionId(null);
      setCurrentPeriodEnd(null);
      setClientSecret(null);
    }
  }, [user, refreshSubscriptionStatus]);

  // Create a subscription
  const createSubscription = async (name: string, email: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to subscribe');
      return null;
    }

    setIsLoading(true);
    try {
      console.log('Making subscription API request with:', {
        customer_name: name,
        customer_email: email,
        user_id: user.id,
      });
      
      const response = await fetch(`${webhookServerUrl}/api/stripe/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          user_id: user.id,
        }),
      });

      console.log('API response status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(data.error || 'Failed to create subscription');
      }

      console.log('Received subscription data:', data);
      
      if (!data.clientSecret) {
        console.error('No clientSecret received from API:', data);
        throw new Error('No client secret received from server');
      }
      
      // Set the client secret in the context state
      setClientSecret(data.clientSecret);
      
      return {
        clientSecret: data.clientSecret,
      };
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error.message || 'Failed to create subscription');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile with name and email
  const updateUserProfile = async (name: string, email: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to update your profile');
      return false;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${webhookServerUrl}/api/stripe/update-user`, { // this doesn't really need a dedicated webhook...
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          name,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      await response.json();
      toast.success('Profile updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all payment state - can be called explicitly
  const clearPaymentState = () => {
    setSubscriptionStatus(null);
    setSubscriptionId(null);
    setCurrentPeriodEnd(null);
    setClientSecret(null);
    console.log('Payment state cleared explicitly');
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to cancel your subscription');
      return false;
    }

    if (!subscriptionId) {
      toast.error('No active subscription found');
      return false;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${webhookServerUrl}/api/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          subscription_id: subscriptionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      await response.json();
      await refreshSubscriptionStatus(); // Refresh status after cancellation
      toast.success('Subscription canceled successfully');
      return true;
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isLoading,
    subscriptionStatus,
    subscriptionId,
    currentPeriodEnd,
    clientSecret,
    stripe,
    createSubscription,
    updateUserProfile,
    refreshSubscriptionStatus,
    clearPaymentState,
    cancelSubscription,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};