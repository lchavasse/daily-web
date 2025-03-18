
import React, { useEffect, useState } from 'react';
import { getIdeas, Idea } from '@/lib/api';
import { X, Edit, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const IdeasView: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const data = await getIdeas();
        setIdeas(data);
      } catch (error) {
        console.error('Error fetching ideas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  const handleExpand = (ideaId: string) => {
    setExpandedIdeaId(prevId => prevId === ideaId ? null : ideaId);
    setEditingIdea(null);
  };

  const handleEdit = (idea: Idea) => {
    setEditingIdea({...idea});
  };

  const handleSave = () => {
    if (editingIdea) {
      // In a real app, we'd send this to the API
      setIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === editingIdea.id ? editingIdea : idea
        )
      );
      setEditingIdea(null);
    }
  };

  const handleCancel = () => {
    setEditingIdea(null);
  };

  const handleEditChange = (field: 'title' | 'content', value: string) => {
    if (editingIdea) {
      setEditingIdea({
        ...editingIdea,
        [field]: value
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading ideas...</div>;
  }

  return (
    <div className="grid gap-4 relative">
      {expandedIdeaId === null ? (
        // Grid view of all ideas
        ideas.map((idea) => (
          <div 
            key={idea.id} 
            className="bg-brown-200 rounded-lg p-4 border border-brown-300 transition-all duration-300 hover:bg-brown-100 cursor-pointer"
            onClick={() => handleExpand(idea.id)}
          >
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">{idea.title}</h3>
              <span className="text-xs text-gray-500">
                {new Date(idea.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{idea.content}</p>
          </div>
        ))
      ) : (
        // Expanded view of a single idea
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0" onClick={() => handleExpand('')}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div 
            className="bg-brown-100 w-full max-w-lg rounded-xl p-6 shadow-lg relative z-10 max-h-[80vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            {editingIdea ? (
              // Edit mode
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={editingIdea.title}
                    onChange={(e) => handleEditChange('title', e.target.value)}
                    className="text-xl font-semibold bg-white/70 border border-brown-200 rounded-lg px-3 py-2 w-full"
                  />
                  <div className="flex gap-2 ml-2">
                    <button 
                      onClick={handleSave}
                      className="bg-brown-400 text-white p-2 rounded-full hover:bg-brown-500 transition-colors"
                    >
                      <Save size={18} />
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="bg-gray-300 text-gray-700 p-2 rounded-full hover:bg-gray-400 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(editingIdea.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <Textarea
                    value={editingIdea.content}
                    onChange={(e) => handleEditChange('content', e.target.value)}
                    className="min-h-[200px] bg-white/70 border border-brown-200 rounded-lg p-3 w-full"
                  />
                </div>
              </div>
            ) : (
              // View mode
              <>
                {ideas.filter(idea => idea.id === expandedIdeaId).map(idea => (
                  <div key={idea.id} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">{idea.title}</h2>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(idea)}
                          className="bg-brown-400 text-white p-2 rounded-full hover:bg-brown-500 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleExpand('')}
                          className="bg-gray-300 text-gray-700 p-2 rounded-full hover:bg-gray-400 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(idea.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="whitespace-pre-wrap">{idea.content}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeasView;
