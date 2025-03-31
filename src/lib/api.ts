const BASE_URL = import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3000';
console.log('Using webhook server URL:', BASE_URL);

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  updates: any; // Using any for jsonb type
  created_at: string;
  updated_at: string;
  completed: boolean;
  recurring: boolean;
  project_id?: string | null;
  important?: boolean;
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
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  updates: any; // Using any for jsonb type
  created_at: string;
  updated_at: string;
  completed: boolean;
  recurring: boolean;
  project_id?: string | null;
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

export async function getUserTasks(userId: string): Promise<{ success: boolean, data: Task[], error?: string }> {
  try {
    console.log('Fetching tasks for user:', userId);
    
    const response = await fetch(`${BASE_URL}/dev/user/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    console.log('Raw tasks API response status:', response.status);
    const rawData = await response.json();
    console.log('Raw tasks API response data:', rawData);
    
    return rawData;
  } catch (error) {
    console.error('Error in getUserTasks API call:', error);
    return { success: false, data: [], error: 'Network error' };
  }
}

export async function fetchUserTasksForDashboard(userId: string): Promise<Task[]> {
  try {
    if (!userId) {
      console.error('User ID is required to fetch tasks');
      return [];
    }
    
    const response = await getUserTasks(userId);
    if (response.success && response.data) {
      // Ensure we're returning an array
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error('Received non-array data from API:', response.data);
        return [];
      }
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

export async function createUserTask(
  userId: string, 
  taskData: {
    title: string;
    description?: string;
    due_date?: string;
    updates?: any;
    recurring?: boolean;
    completed?: boolean;
    important?: boolean;
  }
): Promise<{ success: boolean; data?: Task; error?: string }> {
  try {
    if (!userId) {
      console.error('User ID is required to create a task');
      return { success: false, error: 'User ID is required' };
    }
    
    // Create the payload with defaults
    const payload: {
      userId: string;
      title: string;
      description?: string;
      due_date?: string;
      updates?: any;
      recurring?: boolean;
      completed?: boolean;
      timezone?: string;
    } = {
      userId,
      ...taskData,
      // Set defaults for optional fields if not provided
      updates: taskData.updates || [],
      recurring: taskData.recurring !== undefined ? taskData.recurring : false,
      completed: taskData.completed !== undefined ? taskData.completed : false
    };
    
    // Include the browser's timezone information when sending due dates
    if (taskData.due_date) {
      payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log(`Including timezone information: ${payload.timezone}`);
    }
    
    const response = await fetch(`${BASE_URL}/dev/user/tasks/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Failed to create task:', data.error || 'Unknown error');
      return { 
        success: false, 
        error: data.error || 'Failed to create task' 
      };
    }
    
    return { success: true, data: data.task };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: 'Network error when creating task' };
  }
}

export async function updateUserTask(
  userId: string,
  taskId: string,
  taskData: Partial<{
    title: string;
    description: string;
    due_date: string;
    updates: any;
    recurring: boolean;
    completed: boolean;
    project_id: string;
    important: boolean;
  }>
): Promise<{ success: boolean; data?: Task; error?: string }> {
  try {
    if (!userId || !taskId) {
      console.error('User ID and Task ID are required to update a task');
      return { success: false, error: 'User ID and Task ID are required' };
    }
    
    // Add timezone information if we're updating a due date
    const payload: {
      userId: string;
      taskId: string;
      title?: string;
      description?: string;
      due_date?: string;
      updates?: any;
      recurring?: boolean;
      completed?: boolean;
      project_id?: string;
      timezone?: string;
    } = {
      userId,
      taskId,
      ...taskData,
    };
    
    // Include the browser's timezone information when sending due dates
    if (taskData.due_date !== undefined) {
      payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    
    const response = await fetch(`${BASE_URL}/dev/user/tasks/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Failed to update task:', data.error || 'Unknown error');
      return { 
        success: false, 
        error: data.error || 'Failed to update task' 
      };
    }
    
    return { success: true, data: data.task };
  } catch (error) {
    console.error('Error updating task:', error);
    return { success: false, error: 'Network error when updating task' };
  }
}

export async function toggleTaskCompletion(
  userId: string,
  taskId: string,
  currentStatus: boolean
): Promise<{ success: boolean; data?: Task; error?: string }> {
  return updateUserTask(userId, taskId, { completed: !currentStatus });
}

export async function toggleTaskImportance(
  userId: string,
  taskId: string,
  currentStatus: boolean
): Promise<{ success: boolean; data?: Task; error?: string }> {
  return updateUserTask(userId, taskId, { important: !currentStatus });
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
