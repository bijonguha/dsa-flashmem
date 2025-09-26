import React, { useCallback, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { AppSettings } from '../../types';
import { SupabaseDataService } from '../../services/SupabaseDataService';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSettingChange = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      onSettingsChange({ ...settings, [key]: value });
    },
    [settings, onSettingsChange],
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (settings.id) {
        // Ensure userId is available
        await SupabaseDataService.updateSettings(settings);
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* OpenAI API Key */}
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key (for AI evaluation)
            </label>
            <input
              id="api-key"
              type="password"
              value={settings.openai_api_key || ''}
              onChange={(e) => handleSettingChange('openai_api_key', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="sk-..."
              autoComplete="off"
            />
            <p className="mt-1 text-sm text-gray-500">
              Your API key is stored locally and never shared.
            </p>
          </div>

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
    </div>
  );
};

export default Settings;
