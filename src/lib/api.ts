const BASE_URL = import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3000';
console.log('Using webhook server URL:', BASE_URL);

export interface Task {
  id: string;
  title: string;
  updates: string[];
  deadline: string;
}

export interface Idea {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

export interface UserProfile {
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  start_q: string | null;
  notes: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  user_id: string;
  created_at: string;
}

export interface UserTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  project_id: string | null;
  user_id: string;
  created_at: string;
  completed_at: string | null;
}

export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  date_time: string;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  user_id: string;
  created_at: string;
}

export async function getUserProfile(userId: string): Promise<{ success: boolean, data: UserProfile | null, error?: string }> {
  const response = await fetch(`${BASE_URL}/dev/user/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();
  return data;
}

export async function fetchUserProfileForDashboard(userId: string): Promise<UserProfile | null> {
  try {
    if (!userId) {
      console.error('User ID is required to fetch profile');
      return null;
    }
    
    const response = await getUserProfile(userId);
    if (response.success && response.data) {
      return response.data;
    } else {
      console.error('Failed to fetch user profile:', response.error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function getUserProjects(userId: string): Promise<{ success: boolean, data: Project[], error?: string }> {
  const response = await fetch(`${BASE_URL}/dev/user/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();
  return data;
}

export async function fetchUserProjectsForDashboard(userId: string): Promise<Project[]> {
  try {
    if (!userId) {
      console.error('User ID is required to fetch projects');
      return [];
    }
    
    const response = await getUserProjects(userId);
    if (response.success && response.data) {
      return response.data;
    } else {
      console.error('Failed to fetch user projects:', response.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return [];
  }
}

export async function getUserTasks(userId: string): Promise<{ success: boolean, data: UserTask[], error?: string }> {
  const response = await fetch(`${BASE_URL}/dev/user/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();
  return data;
}

export async function fetchUserTasksForDashboard(userId: string): Promise<UserTask[]> {
  try {
    if (!userId) {
      console.error('User ID is required to fetch tasks');
      return [];
    }
    
    const response = await getUserTasks(userId);
    if (response.success && response.data) {
      return response.data;
    } else {
      console.error('Failed to fetch user tasks:', response.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    return [];
  }
}

export async function getUserReminders(userId: string): Promise<{ success: boolean, data: Reminder[], error?: string }> {
  const response = await fetch(`${BASE_URL}/dev/user/reminders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();
  return data;
}

export async function fetchUserRemindersForDashboard(userId: string): Promise<Reminder[]> {
  try {
    if (!userId) {
      console.error('User ID is required to fetch reminders');
      return [];
    }
    
    const response = await getUserReminders(userId);
    if (response.success && response.data) {
      return response.data;
    } else {
      console.error('Failed to fetch user reminders:', response.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user reminders:', error);
    return [];
  }
}

export async function getTasks(): Promise<Task[]> {
  // Mock implementation for now
  return [
    {
      id: '1',
      title: 'Plan the launch event',
      updates: ['Booked venue @ Old St.', 'Created Luma event'],
      deadline: '2023-06-15'
    },
    {
      id: '2',
      title: 'Finalize marketing materials',
      updates: ['Created social banners', 'Drafted email campaign'],
      deadline: '2023-06-10'
    },
    {
      id: '3',
      title: 'Prepare product demo',
      updates: ['Outlined key features', 'Built slide deck'],
      deadline: '2023-06-12'
    }
  ];
}

export async function getIdeas(): Promise<Idea[]> {
  // Mock implementation for now
  return [
    {
      id: '1',
      title: 'Voice assistant improvements',
      content: 'Add more natural language processing capabilities',
      date: '2023-05-28'
    },
    {
      id: '2',
      title: 'New dashboard feature',
      content: 'Create a weekly summary view',
      date: '2023-05-30'
    },
    {
      id: '3',
      title: 'Mobile app integration',
      content: 'Sync data between web and mobile',
      date: '2023-06-01'
    }
  ];
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  // Mock implementation for now
  return [
    {
      id: '1',
      date: '2023-06-01',
      content: 'Made significant progress on the launch preparations today.'
    },
    {
      id: '2',
      date: '2023-06-02',
      content: 'Had a productive meeting with the design team.'
    },
    {
      id: '3',
      date: '2023-06-03',
      content: 'Resolved several technical issues with the AI model.'
    }
  ];
}

export async function requestCall(phone: string): Promise<{ success: boolean }> {
  try {

    // Prepare the request to the server
    const futureDate = new Date(Date.now() + 30000); // 30 seconds in the future
    const formattedDate = futureDate.toISOString().split('.')[0] + 'Z'; // Remove milliseconds and ensure Z suffix

    const response = await fetch(`${BASE_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phone
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to submit phone number');
    }

    return { success: true };
  } catch (error) {
    console.error('Error requesting call:', error);
    return { success: false };
  }
}

// New functions for phone verification

/**
 * Tests the connection to the webhook server
 */
export async function testServerConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log('Testing connection to webhook server:', BASE_URL);
    
    const response = await fetch(`${BASE_URL}/user/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || 'Failed to connect to server' 
      };
    }
    
    return { 
      success: true,
      message: data.message || 'Server is running correctly'
    };
  } catch (error) {
    console.error('Error testing server connection:', error);
    return { 
      success: false, 
      error: 'Network error when connecting to server' 
    };
  }
}

/**
 * Sends an OTP to the provided phone number without creating a new user
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Sending OTP to:', phone);
    console.log('Using webhook server URL:', BASE_URL);
    
    const response = await fetch(`${BASE_URL}/user/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });
    
    console.log('OTP send response status:', response.status);
    const data = await response.json();
    console.log('OTP send response data:', data);
    
    if (!response.ok) {
      console.error('Failed to send OTP:', data.error || 'Unknown error');
      return { 
        success: false, 
        error: data.error || 'Failed to send OTP' 
      };
    }
    
    console.log('OTP sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: 'Network error when sending OTP' };
  }
}

/**
 * Verifies an OTP for a phone number without creating a new user
 */
export async function verifyOtp(
  phone: string, 
  otp: string, 
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Verifying OTP:', { 
      phone, 
      otp: otp ? otp.substring(0, 2) + '****' : 'undefined', 
      userId 
    });
    console.log('Using webhook server URL:', BASE_URL);
    
    if (!otp) {
      console.error('OTP is undefined or empty');
      return { 
        success: false, 
        error: 'OTP is required' 
      };
    }
    
    const response = await fetch(`${BASE_URL}/user/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, otp, userId }),
    });
    
    console.log('OTP verification response status:', response.status);
    const data = await response.json();
    console.log('OTP verification response data:', data);
    
    if (!response.ok) {
      console.error('Failed to verify OTP:', data.error || 'Unknown error');
      return { 
        success: false, 
        error: data.error || 'Failed to verify OTP' 
      };
    }
    
    console.log('OTP verified successfully');
    return { success: true };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: 'Network error when verifying OTP' };
  }
}
