
import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { requestCall } from '@/lib/api';

const RequestCallForm: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await requestCall(phone);
      if (response.success) {
        toast.success('Call requested successfully');
        setPhone('');
      } else {
        toast.error('Failed to request call');
      }
    } catch (error) {
      console.error('Error requesting call:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="daily-card w-full max-w-lg mx-auto mb-6 animate-fade-in">
      <h2 className="text-sm font-medium mb-4">request a call from daily.</h2>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1">
          <span className="text-sm">+44</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="daily-input"
            placeholder="phone number"
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit" 
          className="daily-btn rounded-full p-2"
          disabled={isLoading}
        >
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};

export default RequestCallForm;
