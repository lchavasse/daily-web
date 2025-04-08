import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock, CheckSquare, Square, Plus, Pencil, Check, X, Calendar, Edit, Star } from 'lucide-react';
import { fetchUserTasksForDashboard, Task, updateUserTask, toggleTaskCompletion, createUserTask, toggleTaskImportance } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const TasksView: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    due_date: '',
    due_time: '12:00', // Default to midday
    important: false
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const [editDescriptionText, setEditDescriptionText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState<string | null>(null);
  const [dueDateText, setDueDateText] = useState('');
  const [dueTimeText, setDueTimeText] = useState('');
  const [savingDueDate, setSavingDueDate] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [togglingImportanceId, setTogglingImportanceId] = useState<string | null>(null);

  // Detect if the device is mobile based on screen width
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [user?.id]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (user?.id) {
        const data = await fetchUserTasksForDashboard(user.id);
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          console.error('Received non-array data:', data);
          setTasks([]);
          setError('Received invalid data format from server');
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      setError('Failed to fetch tasks. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sort tasks by importance, due date, and creation date
  const sortTasks = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      // 1. Important tasks first
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;
      
      // 2. Then by soonest due date (if both have due dates)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      // Tasks with due dates come before tasks without due dates
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      
      // 3. Then by most recently created
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const toggleTask = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
    setEditingTask(null);
    setEditingDueDate(null);
  };

  const handleToggleTaskCompletion = async (taskId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing when clicking the checkbox
    
    try {
      setUpdatingTaskId(taskId);
      if (user?.id) {
        const result = await toggleTaskCompletion(user.id, taskId, currentStatus);
        if (result.success && result.data) {
          if (Array.isArray(tasks)) {
            // Update the task in the tasks array and maintain sorting
            const updatedTasks = tasks.map(task => 
              task.id === taskId ? result.data as Task : task
            );
            setTasks(updatedTasks);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleToggleImportance = async (taskId: string, currentStatus: boolean = false, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing when clicking the star
    
    try {
      setTogglingImportanceId(taskId);
      if (user?.id) {
        const result = await toggleTaskImportance(user.id, taskId, currentStatus);
        if (result.success && result.data) {
          if (Array.isArray(tasks)) {
            // Update the task in the tasks array and maintain sorting
            const updatedTasks = tasks.map(task => 
              task.id === taskId ? result.data as Task : task
            );
            setTasks(updatedTasks);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling task importance:', error);
    } finally {
      setTogglingImportanceId(null);
    }
  };

  const handleEditTask = (taskId: string, title: string, description: string | null, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing when clicking the edit button
    setEditingTask(taskId);
    setEditTitleText(title || '');
    setEditDescriptionText(description || '');
    setEditingDueDate(null);
  };

  const handleSaveEdit = async (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !editTitleText.trim()) return;
    
    try {
      setSavingEdit(true);
      
      const result = await updateUserTask(user.id, taskId, {
        title: editTitleText,
        description: editDescriptionText
      });
      
      if (result.success && result.data) {
        if (Array.isArray(tasks)) {
          const updatedTasks = tasks.map(t => 
            t.id === taskId ? result.data as Task : t
          );
          setTasks(updatedTasks);
        }
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditDueDate = (taskId: string, currentDueDate: string | null, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing when clicking the edit button
    setEditingDueDate(taskId);
    
    // Initialize with current values or defaults
    if (currentDueDate) {
      const date = new Date(currentDueDate);
      // Format the date as YYYY-MM-DD for the date input
      setDueDateText(date.toISOString().split('T')[0]);
      
      // Format the time as HH:MM for the time input (local time)
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setDueTimeText(`${hours}:${minutes}`);
    } else {
      // Default to today's date and midday
      const today = new Date();
      setDueDateText(today.toISOString().split('T')[0]);
      setDueTimeText('12:00');
    }
    
    // Make sure other edit modes are disabled
    setEditingTask(null);
  };

  const handleSaveDueDate = async (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !dueDateText) return;
    
    try {
      setSavingDueDate(true);
      
      let due_date;
      if (dueTimeText) {
        // Combine date and time into ISO format
        due_date = `${dueDateText}T${dueTimeText}:00`;
      } else {
        // Just use the date with default midday time
        due_date = `${dueDateText}T12:00:00`;
      }
      
      const result = await updateUserTask(user.id, taskId, { due_date });
      if (result.success && result.data) {
        if (Array.isArray(tasks)) {
          const updatedTasks = tasks.map(t => 
            t.id === taskId ? result.data as Task : t
          );
          setTasks(updatedTasks);
        }
        setEditingDueDate(null);
      }
    } catch (error) {
      console.error('Error updating due date:', error);
    } finally {
      setSavingDueDate(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(null);
    setEditingDueDate(null);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title.trim() || !user?.id) return;
    
    try {
      setCreatingTask(true);
      
      // Combine date and time if both are provided
      let due_date = null;
      if (newTask.due_date) {
        const time = newTask.due_time || '12:00'; // Default to midday if no time specified
        // Combine date and time
        due_date = `${newTask.due_date}T${time}:00`;
      }
      
      const result = await createUserTask(user.id, {
        title: newTask.title,
        description: newTask.description,
        due_date: due_date,
        important: newTask.important
      });
      
      if (result.success && result.data) {
        // Add new task to the array and let the sort function handle placement
        const updatedTasks = Array.isArray(tasks) ? [...tasks, result.data] : [result.data];
        setTasks(updatedTasks);
        
        setNewTask({ 
          title: '', 
          description: '', 
          due_date: '',
          due_time: '12:00', // Reset to default midday
          important: false
        });
        setShowNewTaskForm(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreatingTask(false);
    }
  };

  const formatDueDate = (dueDateString: string, expanded: boolean = false) => {
    const date = new Date(dueDateString);
    
    // Only show time in the date pill when the task is expanded
    if (expanded && !isMobile) {
      // Format with date and time
      return date.toLocaleString('en-GB', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // Always use date only format when not expanded
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short'
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
        <button 
          onClick={fetchTasks}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Ensure tasks is an array
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  
  // Split tasks into active and completed
  const activeTasks = sortTasks(tasksArray.filter(task => !task.completed));
  const completedTasks = sortTasks(tasksArray.filter(task => task.completed));

  return (
    <div className="space-y-8">
      
      
      {showNewTaskForm && (
        <div className="bg-white/80 rounded-lg p-4 border border-gray-200 mb-4">
          <form onSubmit={handleCreateTask}>
            <div className="space-y-3">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  id="title"
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Task title"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Add details..."
                  rows={2}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <input
                        id="due_date"
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        id="due_time"
                        type="time"
                        value={newTask.due_time}
                        onChange={(e) => setNewTask({...newTask, due_time: e.target.value})}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Time (default: 12:00)"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setNewTask({...newTask, important: !newTask.important})}
                      className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                        newTask.important ? 'text-yellow-500' : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <Star size={20} className={newTask.important ? "fill-yellow-500" : ""} />
                    </button>
                    <span className="text-sm text-gray-700">Mark as important</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newTask.title.trim() || creatingTask}
                  className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                >
                  {creatingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

        <div className="space-y-3">

        <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{activeTasks.length > 0 ? 'Active Tasks' : ''}</h2>
        <button 
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
        >
          <Plus size={16} />
          {showNewTaskForm ? 'Cancel' : 'New Task'}
        </button>
      </div>
      
      {/* Active Tasks */}
      {activeTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="text-center py-6 bg-white/50 rounded-lg border border-gray-100">
          <p className="text-gray-500">No tasks found. Create your first task!</p>
        </div>
      ) : (
        <>
          
            {activeTasks.map((task) => (
              <div 
                key={task.id} 
                className="daily-card-contrast md:p-6 p-3 transition-all duration-300 hover:bg-[#EBCEB7] group"
              >
                <div 
                  className="flex items-start cursor-pointer"
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="flex-shrink-0">
                    <button 
                      className="focus:outline-none transition-colors hover:bg-white/10 rounded"
                      onClick={(e) => handleToggleTaskCompletion(task.id, task.completed, e)}
                      disabled={updatingTaskId === task.id}
                      title="Mark as complete"
                    >
                      {updatingTaskId === task.id ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded"></div>
                      ) : (
                        <Square size={20} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex-grow ml-3">
                    <div className="flex flex-col">
                      {/* edit task form */}
                      {editingTask === task.id ? (
                        <form 
                          onSubmit={(e) => handleSaveEdit(task.id, e)} 
                          onClick={(e) => e.stopPropagation()}
                          className="mb-2 w-full"
                        >
                          <div className="space-y-3">
                            <div>
                              <label htmlFor="title" className="block text-xs text-gray-500 mb-1">Title</label>
                              <input
                                id="title"
                                type="text"
                                value={editTitleText}
                                onChange={(e) => setEditTitleText(e.target.value)}
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="description" className="block text-xs text-gray-500 mb-1">Description (optional)</label>
                              <textarea
                                id="description"
                                value={editDescriptionText}
                                onChange={(e) => setEditDescriptionText(e.target.value)}
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Add a description..."
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleCancelEdit(e)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!editTitleText.trim() || savingEdit}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                {savingEdit ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <>
                          {/* task details */}
                          <div className="flex justify-between">
                            <h3 className="text-sm font-medium mb-1">
                              {task.title}
                            </h3>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleToggleImportance(task.id, task.important, e)}
                                className={`text-xs flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                                  task.important ? 'text-yellow-500' : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title={task.important ? "Remove importance" : "Mark as important"}
                                disabled={togglingImportanceId === task.id}
                              >
                                <Star size={16} className={task.important ? "fill-yellow-500" : ""} />
                              </button>

                              {task.due_date && (
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditDueDate(task.id, task.due_date, e);
                                  }}
                                  className="text-xs flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200"
                                  title="Edit due date"
                                >
                                  <Clock size={12} />
                                  {formatDueDate(task.due_date, expandedTask === task.id)}
                                </span>
                              )}

                              {!task.due_date && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditDueDate(task.id, null, e);
                                  }}
                                  className="text-xs flex items-center gap-1 text-gray-400 px-2 py-1 rounded-full hover:bg-gray-100"
                                  title="Add due date"
                                >
                                  <Calendar size={12} />
                                  Add date
                                </button>
                              )}
                            </div>
                          </div>
                          
                          
                          {/* Only show description if task is expanded or has description */}
                          {(expandedTask === task.id ) && (
                            <div className="group mt-2 flex flex-col items-left">
                              <div className="text-sm text-gray-700 italic">
                                {task.description ? 
                                  <p>{task.description}</p> : 
                                  <p className="text-gray-400 italic">No description</p>
                                }
                              </div>
                              {/* add updates here with date and text */}
                              {task.updates && (
                                <div className="text-sm text-gray-700 mt-2">
                                  <p className="font-medium mb-1"><strong>Updates:</strong></p>
                                  {typeof task.updates === 'object' && !Array.isArray(task.updates) ? (
                                    // Handle object format: { timestamp: text }
                                    Object.entries(task.updates).map(([timestamp, text]) => {
                                      const date = new Date(timestamp);
                                      const formattedDate = date.toLocaleDateString('en-GB', { 
                                        day: 'numeric', 
                                        month: 'short',
                                        year: 'numeric'
                                      });
                                      return (
                                        <p key={timestamp} className="mb-1">
                                          <strong>{formattedDate}:</strong> {text as string}
                                        </p>
                                      );
                                    })
                                  ) : (
                                    // Handle array format for backward compatibility
                                    Array.isArray(task.updates) && task.updates.map((update: { id: string; date: string; text: string }) => (
                                      <p key={update.id} className="mb-1">{update.date} - {update.text}</p>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-between h-full gap-5">
                  <div className="flex-shrink-0 ml-2">
                    <ArrowRight 
                      size={16} 
                      className={`transition-transform duration-300 ${expandedTask === task.id ? 'rotate-90' : ''}`} 
                    />
                  </div>
                  {expandedTask === task.id && (
                  <div className="flex-shrink-0 ml-2 mt-auto">
                  <button
                                onClick={(e) => handleEditTask(task.id, task.title, task.description, e)}
                                className="flex-shrink-0 p-1 rounded opacity-80 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                                title="Edit task"
                              >
                                <Pencil size={14} className="text-gray-400" />
                              </button>
                  </div>
                  )}
                  </div>
                </div>
                
                {editingDueDate === task.id && (
                  <div className="mt-3 pl-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <form onSubmit={(e) => handleSaveDueDate(task.id, e)} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-gray-500">Edit Due Date</h4>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="flex-1">
                            <label htmlFor="due_date" className="block text-xs text-gray-500 mb-1">Date</label>
                            <input
                              id="due_date"
                              type="date"
                              value={dueDateText}
                              onChange={(e) => setDueDateText(e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor="due_time" className="block text-xs text-gray-500 mb-1">Time (default: 12:00)</label>
                            <input
                              id="due_time"
                              type="time"
                              value={dueTimeText}
                              onChange={(e) => setDueTimeText(e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleCancelEdit(e)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!dueDateText || savingDueDate}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                          >
                            {savingDueDate ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}

          
          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="text-sm font-medium text-gray-500">Completed Tasks</h3>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 transition-all duration-300 group"
                  >
                    <div 
                      className="flex items-start cursor-pointer"
                      onClick={() => toggleTask(task.id)}
                    >
                      <button 
                        className="flex-shrink-0 focus:outline-none transition-colors hover:bg-gray-200 p-1 rounded mt-0.5"
                        onClick={(e) => handleToggleTaskCompletion(task.id, task.completed, e)}
                        disabled={updatingTaskId === task.id}
                        title="Mark as incomplete"
                      >
                        {updatingTaskId === task.id ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded animate-spin"></div>
                        ) : (
                          <CheckSquare size={20} className="text-green-500" />
                        )}
                      </button>
                      
                      <div className="flex-grow ml-3">
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-gray-500 line-through">
                            {task.title}
                          </h3>
                          
                          {task.due_date && (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDueDate(task.id, task.due_date, e);
                              }}
                              className="text-xs flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200"
                              title="Edit due date"
                            >
                              <Clock size={12} />
                              {formatDueDate(task.due_date, expandedTask === task.id)}
                            </span>
                          )}
                        </div>
                        
                        {task.important && (
                          <div className="text-xs flex items-center gap-1 text-yellow-500 font-medium mt-1 mb-1">
                            Important
                          </div>
                        )}
                        
                        {expandedTask === task.id && task.description && (
                          <div className="mt-2 text-sm text-gray-500 group">
                            <p>{task.description}</p>
                            
                            {/* Edit button at bottom right when expanded */}
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={(e) => handleEditTask(task.id, task.title, task.description, e)}
                                className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
                                title="Edit task"
                              >
                                <Pencil size={14} className="text-gray-400" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 ml-2">
                        <ArrowRight 
                          size={16} 
                          className={`text-gray-400 transition-transform duration-300 ${expandedTask === task.id ? 'rotate-90' : ''}`} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
        
      )}
    </div>
    </div>
  );
};

export default TasksView;
