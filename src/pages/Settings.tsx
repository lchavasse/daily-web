import { useState, useEffect, useRef } from 'react';
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
import { LoaderCircle, CreditCard, ShieldAlert, Info, ArrowRightCircle, Save, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { updateUser } from '@/lib/api';

// Extend the User type to include preferredVoice
interface ExtendedUser {
  id: string;
  email: string | null;
  phone: string | null;
  preferredVoice?: string;
}

const Settings = () => {
  // Remove debug logging
  
  const { 
    isLoading, 
    subscriptionStatus, 
    subscriptionId, 
    currentPeriodEnd, 
    refreshSubscriptionStatus, 
    cancelSubscription 
  } = usePayment();
  
  // Remove debug payment context values
  
  const { user, logout } = useAuth();
  // Remove debug auth context values
  
  const navigate = useNavigate();
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasLoadedSubscription = useRef(false);

  // Account settings state
  const [email, setEmail] = useState(user?.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [preferredVoice, setPreferredVoice] = useState((user as ExtendedUser)?.preferredVoice || 'default');
  const [isSavingVoice, setIsSavingVoice] = useState(false);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPhone(user.phone || '');
      // Try to get the voice property, fallback to preferredVoice for backward compatibility
      const userVoice = (user as any).voice || (user as ExtendedUser)?.preferredVoice || 'default';
      setPreferredVoice(userVoice);
    }
  }, [user]);

  // Handle save email
  const handleSaveEmail = async () => {
    if (!user) return;
    
    setIsSavingEmail(true);
    try {
      const result = await updateUser(user.id, 'email', email);
      
      if (result.success) {
        toast.success('Email updated successfully');
        setIsEditingEmail(false);
      } else {
        toast.error(result.error || 'Failed to update email');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    } finally {
      setIsSavingEmail(false);
    }
  };

  // Handle save phone
  const handleSavePhone = async () => {
    if (!user) return;
    
    setIsSavingPhone(true);
    try {
      const result = await updateUser(user.id, 'phone', phone);
      
      if (result.success) {
        toast.success('Phone number updated successfully');
        setIsEditingPhone(false);
      } else {
        toast.error(result.error || 'Failed to update phone number');
      }
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast.error('Failed to update phone number');
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Handle voice preference change - saves automatically
  const handleVoiceChange = async (value: string) => {
    if (!user) return;
    
    setPreferredVoice(value);
    setIsSavingVoice(true);
    
    try {
      const result = await updateUser(user.id, 'voice', value);
      
      if (result.success) {
        toast.success('Voice preference updated');
      } else {
        toast.error(result.error || 'Failed to update voice preference');
        // Revert to previous value if there was an error
        setPreferredVoice((user as ExtendedUser)?.preferredVoice || 'default');
      }
    } catch (error) {
      console.error('Error updating voice preference:', error);
      toast.error('Failed to update voice preference');
      // Revert to previous value if there was an error
      setPreferredVoice((user as ExtendedUser)?.preferredVoice || 'default');
    } finally {
      setIsSavingVoice(false);
    }
  };

  // Refresh subscription status when component loads
  useEffect(() => {
    if (!user?.id || hasLoadedSubscription.current) return;
    
    // Minimal logging
    console.log('Loading subscription data');
    refreshSubscriptionStatus();
    hasLoadedSubscription.current = true;
  }, [user]);

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
    navigate('/welcome');
  };

  // Handle user logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-3xl pt-8 pb-16">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="daily-card w-full animate-fade-in space-y-8">
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
                  ) : subscriptionStatus === 'active' || subscriptionStatus === 'trialing' ? (
                    <Button 
                      onClick={() => setCancelDialogOpen(true)} 
                      variant="outline" 
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red -50"
                    >
                      Cancel Subscription
                    </Button>
                  ) : (
                    <Button onClick={() => window.open('mailto:daily@nile-street.com', '_blank')} size="sm">
                      contact support to manage subscription.
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
              <div className="grid grid-cols-2 gap-4">
                {/* Email Field - Editable */}
                <div className="text-sm text-muted-foreground">Email:</div>
                <div className="flex items-center space-x-2">
                  {isEditingEmail ? (
                    <>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-500"
                        onClick={handleSaveEmail}
                        disabled={isSavingEmail}
                      >
                        {isSavingEmail ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-sm flex-grow">{email || 'Not available'}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsEditingEmail(!isEditingEmail)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Phone Number Field */}
                <div className="text-sm text-muted-foreground">Phone Number:</div>
                <div className="flex items-center space-x-2">
                  {isEditingPhone ? (
                    <>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Enter phone number"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-500"
                        onClick={handleSavePhone}
                        disabled={isSavingPhone}
                      >
                        {isSavingPhone ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-sm flex-grow">{phone || 'Not available'}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsEditingPhone(!isEditingPhone)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Preferred Voice Dropdown */}
                <div className="text-sm text-muted-foreground">Preferred Voice:</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-grow">
                    <Select 
                      value={preferredVoice} 
                      onValueChange={handleVoiceChange}
                      disabled={isSavingVoice}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isSavingVoice && (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                  )}
                </div>
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
                  onClick={() => window.open('mailto:daily@nile-street.com', '_blank')}
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
