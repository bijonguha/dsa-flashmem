# Feature Updates Documentation

## 1. Enhanced Dashboard with Detailed Review Statistics

The dashboard has been updated to show more detailed information about your flashcard review sessions:

### New Metrics Added:
- **Today's Reviews Distribution**: Shows the count of reviews categorized by self-rating:
  - Again (red): Cards that were difficult to recall
  - Hard (orange): Cards that were challenging
  - Good (blue): Cards with moderate difficulty
  - Easy (green): Cards that were easy to recall
- **Total Reviews**: Sum of all reviews completed today

### How It Works:
The dashboard now fetches today's sessions and analyzes the `self_rating` field to provide these statistics, giving you better insights into your learning patterns.

## 2. Google Gemini AI Integration (Optional)

We've added support for Google Gemini as an alternative to OpenAI for answer evaluation:

### Features:
- **Fallback Mechanism**: If Google Gemini is configured but fails, the system automatically falls back to OpenAI
- **User Preference**: Users can choose which AI service to use via their settings
- **Default Model Configuration**: The OpenAI model can be configured via environment variables

### How to Use:
1. Get a Google Gemini API key from the Google AI Studio (optional)
2. Add it to your settings in the Settings page
3. The system will automatically use Gemini for evaluation, falling back to OpenAI if needed

### Environment Variables:
- `VITE_OPENAI_MODEL`: Configure the default OpenAI model (default: gpt-4o-mini)
- `VITE_OPENAI_API_KEY`: Add your OpenAI API key directly to the environment (default)

## 3. Updated Settings Interface

The settings page now includes fields for both OpenAI and Google Gemini API keys:

- **OpenAI API Key**: Default AI service for evaluation
- **Google Gemini API Key**: Alternative to OpenAI for AI evaluation (optional)

## 4. Improved AI Evaluation Logic

The flashcard review component now supports both OpenAI and Google Gemini:

1. If a Gemini API key is provided, it will be used first
2. If Gemini evaluation fails, the system automatically falls back to OpenAI
3. If neither key is provided, a simple keyword-based evaluation is used

This provides redundancy and choice for users while maintaining the core functionality.

## Default Configuration

By default, the application uses OpenAI with the gpt-4o-mini model. Users can:
- Add their OpenAI API key to the settings or environment variables
- Optionally add a Google Gemini API key for alternative evaluation
- Continue using the application without any API keys for basic functionality