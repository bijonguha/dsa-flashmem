import { Flashcard, EvaluationResult } from '../types';

export class GeminiService {
  private static readonly API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private static readonly MAX_TOKENS = 1000;
  private static readonly TEMPERATURE = 0.3;

  static async evaluateAnswer(
    flashcard: Flashcard,
    userAnswer: string,
    apiKey: string,
  ): Promise<EvaluationResult> {
    if (!apiKey) {
      throw new Error('Google Gemini API key is required');
    }

    if (!userAnswer.trim()) {
      return {
        score: 0,
        feedback: 'No answer provided. Please provide your solution approach.',
        missing_points: flashcard.expected_points,
        suggestions: ['Try to explain your thought process', 'Break down the problem step by step'],
      };
    }

    const prompt = this.constructEvaluationPrompt(flashcard, userAnswer);

    try {
      const response = await fetch(`${this.API_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: this.MAX_TOKENS,
            temperature: this.TEMPERATURE,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message ||
            `Google Gemini API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No response content from Google Gemini');
      }

      return this.parseEvaluationResponse(content, flashcard.expected_points);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to evaluate answer with Google Gemini');
    }
  }

  private static constructEvaluationPrompt(flashcard: Flashcard, userAnswer: string): string {
    return `
PROBLEM: ${flashcard.question}

EXPECTED KEY POINTS:
${flashcard.expected_points.map((point, i) => `${i + 1}. ${point}`).join('\n')}

CANDIDATE'S ANSWER:
"${userAnswer}"

Please evaluate this answer and respond with a JSON object containing:
{
  "score": <number from 0-100>,
  "feedback": "<constructive feedback string>",
  "missing_points": [<array of missing key points from expected_points>],
  "suggestions": [<array of specific improvement suggestions>]
}

Scoring Guidelines:
- 90-100: Excellent understanding, covers all key points with proper analysis
- 80-89: Good understanding, covers most key points with minor gaps
- 70-79: Adequate understanding, covers some key points but missing details
- 60-69: Basic understanding, limited coverage of key concepts
- 50-59: Minimal understanding, significant gaps in explanation
- 0-49: Poor understanding, major misconceptions or no valid approach

Focus on:
1. Correctness of the algorithmic approach
2. Proper time/space complexity analysis
3. Consideration of edge cases
4. Clarity of explanation
5. Coverage of expected key points

Provide specific, actionable feedback to help the candidate improve.`;
  }

  private static parseEvaluationResponse(
    content: string,
    expectedPoints: string[],
  ): EvaluationResult {
    try {
      // Extract JSON from the response (handle potential markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and sanitize the response
      const evaluation: EvaluationResult = {
        score: this.validateScore(parsed.score),
        feedback: this.validateFeedback(parsed.feedback),
        missing_points: this.validateMissingPoints(parsed.missing_points, expectedPoints),
        suggestions: this.validateSuggestions(parsed.suggestions),
      };

      return evaluation;
    } catch {
      // Fallback parsing if JSON parsing fails
      return this.createFallbackResponse(content, expectedPoints);
    }
  }

  private static validateScore(score: unknown): number {
    const numScore = Number(score as unknown);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return 0;
    }
    return Math.round(numScore);
  }

  private static validateFeedback(feedback: unknown): string {
    if (typeof feedback !== 'string' || feedback.trim().length === 0) {
      return 'Unable to generate detailed feedback at this time. Please review the expected points.';
    }
    return feedback.trim();
  }

  private static validateMissingPoints(missingPoints: unknown, expectedPoints: string[]): string[] {
    if (!Array.isArray(missingPoints)) {
      return expectedPoints; // Assume all points are missing if invalid
    }

    return (missingPoints as unknown[])
      .filter((point): point is string => typeof point === 'string' && point.trim().length > 0)
      .slice(0, expectedPoints.length); // Limit to expected points length
  }

  private static validateSuggestions(suggestions: unknown): string[] {
    if (!Array.isArray(suggestions)) {
      return ['Review the problem requirements', 'Consider the expected key points'];
    }

    return (suggestions as unknown[])
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 5); // Limit to 5 suggestions
  }

  private static createFallbackResponse(
    content: string,
    expectedPoints: string[],
  ): EvaluationResult {
    // Try to extract a score from the content
    const scoreMatch = content.match(/score[:\s]*(\d+)/i);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;

    return {
      score,
      feedback:
        content.length > 0 ? content.substring(0, 500) : 'Could not evaluate answer properly.',
      missing_points: expectedPoints,
      suggestions: [
        'Try explaining your approach more clearly',
        'Include time and space complexity analysis',
      ],
    };
  }

  // Utility method to test API key validity
  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test message'
            }]
          }],
          generationConfig: {
            maxOutputTokens: 5,
          }
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}