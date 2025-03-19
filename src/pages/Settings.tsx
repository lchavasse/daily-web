import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import NavigationMenu from '@/components/NavigationMenu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LoaderCircle, CreditCard, ShieldAlert, Info, ArrowRightCircle } from 'lucide-react';

const Settings = () => {
  // Debug logging
  console.log('Settings component rendering');
  
  const { 
    isLoading, 
    subscriptionStatus, 
    subscriptionId, 
    currentPeriodEnd, 
    refreshSubscriptionStatus, 
    cancelSubscription 
  } = usePayment();
  
  // Debug payment context values
  console.log('Payment context values:', { 
    isLoading, 
    subscriptionStatus, 
    subscriptionId, 
    currentPeriodEnd 
  });
  
  const { user, logout } = useAuth();
  // Debug auth context values
  console.log('Auth context values:', { user });
  
  const navigate = useNavigate();
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refresh subscription status when component loads
  useEffect(() => {
    console.log('Settings useEffect running - refreshing subscription');
    refreshSubscriptionStatus();
  }, [user, refreshSubscriptionStatus]);

  // Format date for display
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return format(new Date(timestamp * 1000), 'MMMM d, yyyy');
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      const success = await cancelSubscription();
      if (success) {
        setCancelDialogOpen(false);
        toast.success('Your subscription has been canceled');
        navigate('/');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Get subscription status display
  const getStatusDisplay = () => {
    if (isLoading) return 'Loading...';
    
    if (!subscriptionStatus) return 'No active subscription';
    
    switch (subscriptionStatus) {
      case 'active':
        return 'Active';
      case 'canceled':
        return 'Canceled (access until end of billing period)';
      case 'past_due':
        return 'Past due (payment required)';
      case 'incomplete':
        return 'Incomplete (setup required)';
      case 'incomplete_expired':
        return 'Setup expired (please resubscribe)';
      case 'trialing':
        return 'Trial period';
      case 'unpaid':
        return 'Unpaid (payment required)';
      default:
        return subscriptionStatus;
    }
  };

  // Redirect to subscription page
  const handleSubscribe = () => {
    navigate('/subscribe');
  };

  // Handle user logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md mx-auto pt-8 pb-16">
        <div className="mb-10">
          <Logo />
        </div>

        <div className="daily-card animate-fade-in space-y-8">
          <h2 className="text-xl font-medium mb-4">Settings</h2>
          
          {/* Subscription Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-medium">Subscription</h3>
            </div>
            
            {isLoading ? (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Loading subscription details...</span>
              </div>
            ) : (
              <Card className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Status:</div>
                  <div className="text-sm font-medium">{getStatusDisplay()}</div>
                  
                  {subscriptionId && (
                    <>
                      <div className="text-sm text-muted-foreground">Subscription ID:</div>
                      <div className="text-sm font-mono text-xs">{subscriptionId}</div>
                    </>
                  )}
                  
                  {currentPeriodEnd && (
                    <>
                      <div className="text-sm text-muted-foreground">Current Period Ends:</div>
                      <div className="text-sm">{formatDate(currentPeriodEnd)}</div>
                    </>
                  )}
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-end space-x-2">
                  {!subscriptionStatus || subscriptionStatus === 'canceled' || subscriptionStatus === 'incomplete_expired' ? (
                    <Button onClick={handleSubscribe} size="sm">
                      Subscribe
                    </Button>
                  ) : subscriptionStatus === 'active' ? (
                    <Button 
                      onClick={() => setCancelDialogOpen(true)} 
                      variant="outline" 
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Cancel Subscription
                    </Button>
                  ) : (
                    <Button onClick={handleSubscribe} size="sm">
                      Manage Subscription
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
          
          {/* Account Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-medium">Account</h3>
            </div>
            
            <Card className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-muted-foreground">Email:</div>
                <div className="text-sm">{user?.email || 'Not available'}</div>
                
                <div className="text-sm text-muted-foreground">User ID:</div>
                <div className="text-sm font-mono text-xs">{user?.id || 'Not available'}</div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground"
                >
                  Logout
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Help Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-medium">Help</h3>
            </div>
            
            <Card className="p-4 space-y-4">
              <div className="text-sm">
                Need help with your account or have questions about your subscription?
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="link" 
                  size="sm"
                  className="flex items-center text-indigo-500"
                  onClick={() => window.open('mailto:support@daily.app', '_blank')}
                >
                  <span>Contact Support</span>
                  <ArrowRightCircle className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Subscription Cancellation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 border border-amber-200 rounded p-3 my-4">
            <div className="flex items-start">
              <ShieldAlert className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div className="text-sm text-amber-800">
                After cancellation, your subscription will remain active until{' '}
                <span className="font-medium">{formatDate(currentPeriodEnd)}</span>, after which you'll lose access to premium features.
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(false)}
              disabled={isProcessing}
            >
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NavigationMenu />
    </div>
  );
};

export default Settings;
