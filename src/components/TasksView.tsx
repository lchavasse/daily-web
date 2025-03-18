
import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { getTasks, Task } from '@/lib/api';

const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const toggleTask = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="bg-white/50 rounded-lg p-4 border border-gray-100 transition-all duration-300 hover:bg-white/70">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleTask(task.id)}
          >
            <h3 className="text-sm font-medium">{task.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs flex items-center gap-1">
                <Clock size={12} />
                {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
              <ArrowRight 
                size={16} 
                className={`transition-transform duration-300 ${expandedTask === task.id ? 'rotate-90' : ''}`} 
              />
            </div>
          </div>
          
          {expandedTask === task.id && task.updates.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-2 animate-fade-in">
              {task.updates.map((update, index) => (
                <div key={index} className="text-sm flex items-start gap-2">
                  <span className="text-gray-400 min-w-[6px]">•</span>
                  <span>{update}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TasksView;
