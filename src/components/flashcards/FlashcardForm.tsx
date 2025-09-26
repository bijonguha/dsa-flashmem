import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { Flashcard } from '../../types';
import { SupabaseDataService } from '../../services/SupabaseDataService';
import { useAuth } from '../../hooks/useAuth';

export const FlashcardForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [flashcard, setFlashcard] = useState<Partial<Flashcard>>({
    topic: '',
    title: '',
    question: '',
    hint: '',
    expected_points: [],
    solution: {
      approaches: [
        {
          name: '',
          code: '',
          time_complexity: '',
          space_complexity: '',
          explanation: '',
        },
      ],
    },
    difficulty: 'Medium',
    tags: [],
  });

  // Load existing flashcard for editing
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && user) {
      setIsEditing(true);
      setEditingId(editId);
      loadFlashcard(editId);
    }
  }, [searchParams, user]);

  const loadFlashcard = async (cardId: string) => {
    try {
      const cards = await SupabaseDataService.getAllFlashcards(user!.id);
      const card = cards.find(c => c.id === cardId);
      if (card) {
        setFlashcard(card);
      }
    } catch (error) {
      console.error('Failed to load flashcard:', error);
      setError('Failed to load flashcard for editing');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFlashcard((prev) => ({ ...prev, [name]: value }));
  };

  const handleApproachChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const approaches = [...(flashcard.solution?.approaches || [])];
    approaches[index] = { ...approaches[index], [name]: value };
    setFlashcard((prev) => ({
      ...prev,
      solution: { ...prev.solution, approaches },
    }));
  };

  const addApproach = () => {
    const approaches = [...(flashcard.solution?.approaches || [])];
    approaches.push({
      name: '',
      code: '',
      time_complexity: '',
      space_complexity: '',
      explanation: '',
    });
    setFlashcard((prev) => ({
      ...prev,
      solution: { ...prev.solution, approaches },
    }));
  };

  const removeApproach = (index: number) => {
    const approaches = [...(flashcard.solution?.approaches || [])];
    approaches.splice(index, 1);
    setFlashcard((prev) => ({
      ...prev,
      solution: { ...prev.solution, approaches },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to save a flashcard.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Basic validation
      if (!flashcard.title || !flashcard.question || !flashcard.topic) {
        throw new Error('Topic, Title, and Question are required fields.');
      }

      if (isEditing && editingId) {
        // Update existing flashcard
        await SupabaseDataService.updateFlashcard(editingId, user.id, flashcard);
      } else {
        // Create new flashcard
        const newFlashcard: Flashcard = {
          ...flashcard,
          id: crypto.randomUUID(),
          user_id: user.id,
          topic: flashcard.topic || 'General',
          title: flashcard.title,
          question: flashcard.question,
          expected_points: flashcard.expected_points || [],
          solution: flashcard.solution || { approaches: [] },
          difficulty: flashcard.difficulty || 'Medium',
          tags: flashcard.tags || [],
        };

        await SupabaseDataService.addFlashcard(newFlashcard);
      }

      // Navigate back to manage cards or home
      navigate(isEditing ? '/manage-cards' : '/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-8">
        <h2 className="text-3xl font-bold text-neutral-800">
          {isEditing ? 'Edit Flashcard' : 'Create New Flashcard'}
        </h2>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Main Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={flashcard.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
              Topic
            </label>
            <input
              type="text"
              name="topic"
              id="topic"
              value={flashcard.topic}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700">
            Question
          </label>
          <textarea
            name="question"
            id="question"
            value={flashcard.question}
            onChange={handleInputChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          ></textarea>
        </div>

        {/* Solution Approaches */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-800">Solution Approaches</h3>
          {flashcard.solution?.approaches.map((approach, index) => (
            <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-4 relative">
              <h4 className="font-semibold text-gray-700">Approach #{index + 1}</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Approach Name (e.g., Two Pointers)"
                  value={approach.name}
                  onChange={(e) => handleApproachChange(index, e)}
                  className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                />
                <input
                  type="text"
                  name="time_complexity"
                  placeholder="Time Complexity (e.g., O(n))"
                  value={approach.time_complexity}
                  onChange={(e) => handleApproachChange(index, e)}
                  className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                />
                <input
                  type="text"
                  name="space_complexity"
                  placeholder="Space Complexity (e.g., O(1))"
                  value={approach.space_complexity}
                  onChange={(e) => handleApproachChange(index, e)}
                  className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                />
              </div>
              <textarea
                name="code"
                placeholder="Enter code here..."
                value={approach.code}
                onChange={(e) => handleApproachChange(index, e)}
                rows={8}
                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm font-mono"
              ></textarea>
              <textarea
                name="explanation"
                placeholder="Explanation of the approach"
                value={approach.explanation}
                onChange={(e) => handleApproachChange(index, e)}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              ></textarea>

              <button
                type="button"
                onClick={() => removeApproach(index)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addApproach}
            className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <PlusCircle size={18} />
            <span>Add Another Approach</span>
          </button>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <select
              name="difficulty"
              id="difficulty"
              value={flashcard.difficulty}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              id="tags"
              value={Array.isArray(flashcard.tags) ? flashcard.tags.join(', ') : ''}
              onChange={(e) =>
                setFlashcard((prev) => ({
                  ...prev,
                  tags: e.target.value.split(',').map((t) => t.trim()),
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Flashcard' : 'Save Flashcard')}
          </button>
        </div>
      </form>
    </div>
  );
};
