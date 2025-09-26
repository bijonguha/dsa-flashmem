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

## 2. AI Integration (OpenAI Default, Google Gemini Optional)

We've updated the AI evaluation to use environment variables for API keys and provide an optional Google Gemini integration.

### Features:
- **Default OpenAI Usage**: The application uses OpenAI by default with configurable model via environment variables.
- **Optional Gemini Support**: Users can optionally provide a Google Gemini API key via environment variables for alternative evaluation.
- **Fallback Mechanism**: If Google Gemini is configured but fails, the system automatically falls back to OpenAI.
- **No API Keys in Settings**: API keys are now managed solely through environment variables for enhanced security.

### How to Use:
1. Set your `VITE_OPENAI_API_KEY` in your `.env` file.
2. Optionally, set your `VITE_GEMINI_API_KEY` in your `.env` file to enable Gemini evaluation.
3. The application will automatically use the configured AI service.

### Environment Variables:
- `VITE_OPENAI_MODEL`: Configure the default OpenAI model (default: gpt-4o-mini)
- `VITE_OPENAI_API_KEY`: Your OpenAI API key (required for OpenAI evaluation)
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key (optional, for Gemini evaluation)

## 3. Updated Settings Interface

The settings page no longer includes input fields for API keys.

## 4. Improved AI Evaluation Logic

The flashcard review component now supports both OpenAI and Google Gemini:

1. If a Gemini API key is provided via environment variables, it will be used first.
2. If Gemini evaluation fails, the system automatically falls back to OpenAI (if `VITE_OPENAI_API_KEY` is provided).
3. If neither key is provided, a simple keyword-based evaluation is used.

This provides redundancy and choice for users while maintaining the core functionality.

## 5. Daily Review History

A new section has been added to the dashboard to display a day-wise history of reviewed flashcards.

### Features:
- **Day-wise Grouping**: Shows flashcards reviewed on each day.
- **Flashcard Details**: For each reviewed flashcard, it displays the question, the self-rating ('again', 'hard', 'good', 'easy'), and the time taken to answer.
- **Sorting**: History is sorted by date in descending order.

### How It Works:
The dashboard fetches all review sessions and their associated flashcard details, then groups them by the date of the review session to provide a chronological history of your learning.

## Default Configuration

By default, the application uses OpenAI with the gpt-4o-mini model. Users can:
- Provide their OpenAI API key via `VITE_OPENAI_API_KEY` in `.env`.
- Optionally provide a Google Gemini API key via `VITE_GEMINI_API_KEY` in `.env` for alternative evaluation.
- Continue using the application without any API keys for basic functionality.