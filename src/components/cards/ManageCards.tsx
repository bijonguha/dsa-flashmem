import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Grid3X3,
  List,
  CheckSquare,
  Square,
  MoreVertical,
  Calendar,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { Flashcard } from '../../types';
import { SupabaseDataService } from '../../services/SupabaseDataService';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ManageCardsProps {
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'created_at' | 'title' | 'topic' | 'difficulty' | 'last_reviewed';
type SortOrder = 'asc' | 'desc';

const CARDS_PER_PAGE = 12;

export const ManageCards: React.FC<ManageCardsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCard, setEditingCard] = useState<string | null>(null);

  // Load flashcards
  const loadFlashcards = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping flashcard load');
      return;
    }
    
    console.log('Loading flashcards for user:', user.id);
    setLoading(true);
    try {
      const cards = await SupabaseDataService.getAllFlashcards(user.id);
      console.log('Loaded flashcards:', cards.length, 'cards');
      setFlashcards(cards);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  // Get unique topics and difficulties for filters
  const { topics, difficulties } = useMemo(() => {
    const topicsSet = new Set<string>();
    const difficultiesSet = new Set<string>();
    
    flashcards.forEach(card => {
      topicsSet.add(card.topic);
      difficultiesSet.add(card.difficulty);
    });
    
    return {
      topics: Array.from(topicsSet).sort(),
      difficulties: Array.from(difficultiesSet).sort()
    };
  }, [flashcards]);

  // Filter and sort flashcards
  const filteredAndSortedCards = useMemo(() => {
    let filtered = flashcards.filter(card => {
      const matchesSearch = searchTerm === '' || 
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTopic = filterTopic === '' || card.topic === filterTopic;
      const matchesDifficulty = filterDifficulty === '' || card.difficulty === filterDifficulty;
      
      return matchesSearch && matchesTopic && matchesDifficulty;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'created_at' || sortBy === 'last_reviewed') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [flashcards, searchTerm, filterTopic, filterDifficulty, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCards.length / CARDS_PER_PAGE);
  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    return filteredAndSortedCards.slice(startIndex, startIndex + CARDS_PER_PAGE);
  }, [filteredAndSortedCards, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTopic, filterDifficulty]);

  // Selection handlers
  const toggleCardSelection = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const selectAllVisible = () => {
    const allVisible = new Set(paginatedCards.map(card => card.id));
    setSelectedCards(allVisible);
  };

  const deselectAll = () => {
    setSelectedCards(new Set());
  };

  // Delete handlers
  const deleteSelectedCards = async () => {
    if (!user || selectedCards.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedCards.size} card(s)?`)) {
      return;
    }

    try {
      for (const cardId of selectedCards) {
        await SupabaseDataService.deleteFlashcard(cardId, user.id);
      }
      await loadFlashcards();
      setSelectedCards(new Set());
    } catch (error) {
      console.error('Failed to delete cards:', error);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      await SupabaseDataService.deleteFlashcard(cardId, user.id);
      await loadFlashcards();
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  // Utility functions
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-success-600 bg-success-100';
      case 'Medium':
        return 'text-warning-600 bg-warning-100';
      case 'Hard':
        return 'text-danger-600 bg-danger-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">Manage Cards</h1>
          <p className="text-neutral-600 mt-1">
            {filteredAndSortedCards.length} of {flashcards.length} cards
          </p>
        </div>
        
        <button
          onClick={() => navigate('/create-flashcard')}
          className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Card</span>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cards..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Topics</option>
            {topics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Difficulties</option>
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>{difficulty}</option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as SortBy);
              setSortOrder(order as SortOrder);
            }}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="topic-asc">Topic A-Z</option>
            <option value="difficulty-asc">Difficulty Easy-Hard</option>
            <option value="difficulty-desc">Difficulty Hard-Easy</option>
          </select>
        </div>

        {/* View Controls and Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedCards.size > 0 && (
              <>
                <span className="text-sm text-neutral-600">
                  {selectedCards.size} selected
                </span>
                <button
                  onClick={deleteSelectedCards}
                  className="flex items-center space-x-1 bg-danger-500 hover:bg-danger-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Deselect All
                </button>
              </>
            )}
            {selectedCards.size === 0 && paginatedCards.length > 0 && (
              <button
                onClick={selectAllVisible}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Select All Visible
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid/List */}
      {paginatedCards.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <h3 className="text-lg font-medium text-neutral-800 mb-2">No cards found</h3>
          <p className="text-neutral-600 mb-4">
            {searchTerm || filterTopic || filterDifficulty 
              ? 'Try adjusting your search or filters' 
              : 'Create your first flashcard to get started'
            }
          </p>
          <button
            onClick={() => navigate('/create-flashcard')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Create First Card
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {paginatedCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <button
                      onClick={() => toggleCardSelection(card.id)}
                      className="text-neutral-400 hover:text-primary-600"
                    >
                      {selectedCards.has(card.id) ? 
                        <CheckSquare className="h-4 w-4" /> : 
                        <Square className="h-4 w-4" />
                      }
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => navigate(`/create-flashcard?edit=${card.id}`)}
                        className="text-neutral-400 hover:text-primary-600 p-1 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteCard(card.id)}
                        className="text-neutral-400 hover:text-danger-600 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <h3 className="font-medium text-neutral-800 mb-2 line-clamp-2">
                    {card.title}
                  </h3>
                  
                  <p className="text-sm text-neutral-600 mb-3 line-clamp-3">
                    {card.question}
                  </p>

                  {/* Card Meta */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">{card.topic}</span>
                    <span className={`px-2 py-1 rounded ${getDifficultyColor(card.difficulty)}`}>
                      {card.difficulty}
                    </span>
                  </div>

                  {/* Card Stats */}
                  <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                    <span>Created: {formatDate(card.created_at)}</span>
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="h-3 w-3" />
                      <span>0 reviews</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="w-10 px-4 py-3 text-left">
                        <Square className="h-4 w-4 text-neutral-400" />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Topic</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Difficulty</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Reviews</th>
                      <th className="w-20 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {paginatedCards.map((card) => (
                      <tr key={card.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleCardSelection(card.id)}
                            className="text-neutral-400 hover:text-primary-600"
                          >
                            {selectedCards.has(card.id) ? 
                              <CheckSquare className="h-4 w-4" /> : 
                              <Square className="h-4 w-4" />
                            }
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-neutral-800 line-clamp-1">
                              {card.title}
                            </div>
                            <div className="text-xs text-neutral-500 line-clamp-1 mt-1">
                              {card.question}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600">{card.topic}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(card.difficulty)}`}>
                            {card.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {formatDate(card.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">0</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => navigate(`/create-flashcard?edit=${card.id}`)}
                              className="text-neutral-400 hover:text-primary-600 p-1 rounded"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteCard(card.id)}
                              className="text-neutral-400 hover:text-danger-600 p-1 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                Showing {((currentPage - 1) * CARDS_PER_PAGE) + 1} to{' '}
                {Math.min(currentPage * CARDS_PER_PAGE, filteredAndSortedCards.length)} of{' '}
                {filteredAndSortedCards.length} cards
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 py-2 border border-neutral-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 2
                    )
                    .map((page, index, arr) => (
                      <React.Fragment key={page}>
                        {index > 0 && arr[index - 1] !== page - 1 && (
                          <span className="text-neutral-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-md ${
                            page === currentPage
                              ? 'bg-primary-500 text-white'
                              : 'text-neutral-600 hover:bg-neutral-100'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))
                  }
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-3 py-2 border border-neutral-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};