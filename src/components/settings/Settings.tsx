import React, { useCallback, useState, useEffect } from 'react';
import { Save, Check, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';
import { AppSettings } from '../../types';
import { SupabaseDataService } from '../../services/SupabaseDataService';
import { SRSService } from '../../services/srs';
import { useAuth } from '../../hooks/useAuth';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onResetComplete?: () => void;
  flashcardCount?: number; // Add this to trigger topic refresh when flashcards change
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSettingsChange,
  onResetComplete,
  flashcardCount,
}) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  // Load available topics
  useEffect(() => {
    const loadTopics = async () => {
      if (user) {
        try {
          const topics = await SRSService.getAvailableTopics(user.id);
          setAvailableTopics(topics);
        } catch (error) {
          console.error('Failed to load available topics:', error);
        }
      }
    };
    loadTopics();
  }, [user, flashcardCount]); // Re-load topics when flashcard count changes

  const handleSettingChange = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      onSettingsChange({ ...settings, [key]: value });
    },
    [settings, onSettingsChange],
  );

  const handleTopicFilterChange = useCallback((topic: string, checked: boolean) => {
    const currentFilters = settings.topic_filters || [];
    const newFilters = checked 
      ? [...currentFilters, topic]
      : currentFilters.filter(t => t !== topic);
    
    // If no topics selected, set to undefined (meaning "all topics")
    handleSettingChange('topic_filters', newFilters.length === 0 ? undefined : newFilters);
  }, [settings.topic_filters, handleSettingChange]);

  const refreshTopics = useCallback(async () => {
    if (user) {
      try {
        const topics = await SRSService.getAvailableTopics(user.id);
        setAvailableTopics(topics);
      } catch (error) {
        console.error('Failed to refresh topics:', error);
      }
    }
  }, [user]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (settings.user_id) {
        await SupabaseDataService.updateSettings(settings.user_id, settings);
        setSaveSuccess(true);
      } else {
        throw new Error('User ID not available for saving settings.');
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // You could add error state here
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const handleResetProgress = useCallback(async () => {
    if (!user?.id) {
      console.error('User ID not available for reset operation');
      return;
    }

    setIsResetting(true);
    setResetSuccess(false);

    try {
      await SRSService.resetAllProgress(user.id);
      setResetSuccess(true);
      setShowResetConfirm(false);

      // Call the reset complete callback if provided
      if (onResetComplete) {
        onResetComplete();
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setResetSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to reset progress:', error);
    } finally {
      setIsResetting(false);
    }
  }, [user?.id, onResetComplete]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

      {/* About User Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">About User</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 text-sm text-gray-900">
              {user?.email || 'No email available'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Timer Duration */}
          <div>
            <label
              htmlFor="timer-duration"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Timer Duration
            </label>
            <select
              id="timer-duration"
              value={settings.timer_duration}
              onChange={(e) => handleSettingChange('timer_duration', Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value={180}>3 minutes</option>
              <option value={300}>5 minutes</option>
              <option value={480}>8 minutes</option>
              <option value={600}>10 minutes</option>
              <option value={900}>15 minutes</option>
            </select>
          </div>

          {/* Input Preference */}
          <div>
            <label
              htmlFor="input-preference"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Input Preference
            </label>
            <select
              id="input-preference"
              value={settings.input_preference}
              onChange={(e) =>
                handleSettingChange(
                  'input_preference',
                  e.target.value as AppSettings['input_preference'],
                )
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="both">Both Voice & Typing</option>
              <option value="voice">Voice Only</option>
              <option value="typing">Typing Only</option>
            </select>
          </div>

          {/* Daily Review Limit */}
          <div>
            <label
              htmlFor="daily-review-limit"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Daily Review Limit
            </label>
            <select
              id="daily-review-limit"
              value={settings.daily_review_limit ?? 0}
              onChange={(e) => {
                const value = Number(e.target.value);
                handleSettingChange('daily_review_limit', value === 0 ? undefined : value);
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value={0}>No limit</option>
              <option value={5}>5 cards per day</option>
              <option value={10}>10 cards per day</option>
              <option value={15}>15 cards per day</option>
              <option value={20}>20 cards per day</option>
              <option value={25}>25 cards per day</option>
              <option value={30}>30 cards per day</option>
              <option value={50}>50 cards per day</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Limit the number of cards to review each day. Set to "No limit" to review all due cards.
            </p>
          </div>

          {/* Topic Filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Topic Filters
              </label>
              <button
                onClick={refreshTopics}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                title="Refresh available topics"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
              {availableTopics.length === 0 ? (
                <p className="text-sm text-gray-500">No topics available. Import some flashcards first.</p>
              ) : (
                <>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="all-topics"
                      checked={!settings.topic_filters || settings.topic_filters.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleSettingChange('topic_filters', undefined);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="all-topics" className="ml-2 text-sm font-medium text-gray-700">
                      All Topics
                    </label>
                  </div>
                  {availableTopics.map((topic) => (
                    <div key={topic} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`topic-${topic}`}
                        checked={settings.topic_filters?.includes(topic) || false}
                        onChange={(e) => handleTopicFilterChange(topic, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`topic-${topic}`} className="ml-2 text-sm text-gray-700">
                        {topic}
                      </label>
                    </div>
                  ))}
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Select specific topics to include in daily reviews. Leave all unchecked to include all topics. 
              Topics update automatically when you import new flashcards.
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-advance"
                checked={settings.auto_advance}
                onChange={(e) => handleSettingChange('auto_advance', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
              />
              <label htmlFor="auto-advance" className="ml-3 text-sm text-gray-700">
                Auto-advance after rating
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-hints"
                checked={settings.show_hints}
                onChange={(e) => handleSettingChange('show_hints', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
              />
              <label htmlFor="show-hints" className="ml-3 text-sm text-gray-700">
                Show hints button
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`
                w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-all duration-200
                ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : saveSuccess
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                }
                text-white focus:outline-none focus:ring-2 focus:ring-offset-2 
                ${saveSuccess ? 'focus:ring-green-500' : 'focus:ring-blue-500'}
              `}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-red-800 mb-2">⚠️ Danger Zone</h3>
        <p className="text-sm text-red-700 mb-4">
          Reset all your learning progress and start fresh. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting}
          className="inline-flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-400"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset All Progress</span>
        </button>
      </div>

      {/* Performance Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Performance Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Voice recognition works best in quiet environments</li>
          <li>• Shorter timer durations can improve focus during practice</li>
          <li>• Enable auto-advance for faster review sessions</li>
          <li>• Use typing mode for better accuracy when voice recognition struggles</li>
        </ul>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Reset All Progress</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to reset all your learning progress? This will permanently
                delete:
              </p>
              <ul className="mt-3 text-sm text-gray-700 space-y-1">
                <li>• All flashcard review history</li>
                <li>• Learning streaks and statistics</li>
                <li>• SRS scheduling data</li>
                <li>• Study session records</li>
              </ul>
              <p className="mt-3 text-sm font-medium text-red-700">
                Your flashcards will remain, but you'll start learning from scratch.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                disabled={isResetting}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    <span>Yes, Reset All Progress</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Success Message */}
      {resetSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>Progress reset successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
