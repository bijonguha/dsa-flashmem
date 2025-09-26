import { Flashcard, ImportResult } from '../types';
import { SupabaseDataService } from './SupabaseDataService';

export class ImportService {
  static async importFromJSON(file: File, userId?: string): Promise<ImportResult> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const flashcards: Flashcard[] = Array.isArray(data) ? data : [data];
      const validatedFlashcards: Flashcard[] = [];
      const errors: string[] = [];

      for (let i = 0; i < flashcards.length; i++) {
        const card = flashcards[i];
        const validation = this.validateFlashcard(card, i);

        if (validation.isValid) {
          validatedFlashcards.push(card);
        } else {
          errors.push(...validation.errors);
        }
      }

      if (validatedFlashcards.length > 0) {
        const upload = userId
          ? validatedFlashcards.map((c) => ({ ...c, user_id: userId }))
          : validatedFlashcards;
        await SupabaseDataService.addFlashcards(upload);
      }

      return {
        success: errors.length === 0,
        imported_count: validatedFlashcards.length,
        errors,
        flashcards: validatedFlashcards,
      };
    } catch (error) {
      return {
        success: false,
        imported_count: 0,
        errors: [
          `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        flashcards: [],
      };
    }
  }

  static async importFromCSV(file: File, userId?: string): Promise<ImportResult> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        return {
          success: false,
          imported_count: 0,
          errors: ['CSV file must have at least a header row and one data row'],
          flashcards: [],
        };
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
      const flashcards: Flashcard[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          const flashcard = this.csvRowToFlashcard(headers, values);

          const validation = this.validateFlashcard(flashcard, i);
          if (validation.isValid) {
            flashcards.push(flashcard);
          } else {
            errors.push(...validation.errors);
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
        }
      }

      if (flashcards.length > 0) {
        const upload = userId ? flashcards.map((c) => ({ ...c, user_id: userId })) : flashcards;
        await SupabaseDataService.addFlashcards(upload);
      }

      return {
        success: errors.length === 0,
        imported_count: flashcards.length,
        errors,
        flashcards,
      };
    } catch (error) {
      return {
        success: false,
        imported_count: 0,
        errors: [
          `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        flashcards: [],
      };
    }
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private static csvRowToFlashcard(headers: string[], values: string[]): Flashcard {
    const getField = (fieldName: string): string => {
      const index = headers.indexOf(fieldName);
      return index >= 0 ? values[index]?.replace(/"/g, '') || '' : '';
    };

    const id = getField('id') || `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const topic = getField('topic') || 'General';
    const title = getField('title') || 'Untitled';
    const question = getField('question');
    const hint = getField('hint') || undefined;
    const expected_points = getField('expected_points')?.split('|') || [];
    const difficulty = (getField('difficulty') as 'Easy' | 'Medium' | 'Hard') || 'Medium';
    const tags = getField('tags')?.split('|') || [];

    // Handle solution - for CSV, we'll create a basic structure
    const solutionCode = getField('solution_code') || '';
    const timeComplexity = getField('time_complexity') || 'O(n)';
    const spaceComplexity = getField('space_complexity') || 'O(1)';
    const explanation = getField('explanation') || '';
    const neetcodeUrl = getField('neetcode_url') || undefined;
    const youtubeUrl = getField('youtube_url') || undefined;

    return {
      id,
      topic,
      title,
      question,
      hint,
      expected_points,
      solution: {
        prerequisites: [],
        youtube_url: youtubeUrl,
        approaches: [
          {
            name: 'Primary Solution',
            code: solutionCode,
            time_complexity: timeComplexity,
            space_complexity: spaceComplexity,
            explanation,
          },
        ],
      },
      neetcode_url: neetcodeUrl,
      difficulty,
      tags,
    };
  }

  private static validateFlashcard(
    card: unknown,
    index: number,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const prefix = `Card ${index + 1}:`;

    // Basic object check
    if (typeof card !== 'object' || card === null) {
      errors.push(`${prefix} Invalid card object`);
      return { isValid: false, errors };
    }

    const c = card as Record<string, unknown>;

    if (typeof c.id !== 'string' || c.id.trim().length === 0) {
      errors.push(`${prefix} Missing or invalid id`);
    }

    if (typeof c.title !== 'string' || c.title.trim().length === 0) {
      errors.push(`${prefix} Missing or invalid title`);
    }

    if (typeof c.question !== 'string' || c.question.trim().length === 0) {
      errors.push(`${prefix} Missing or invalid question`);
    }

    if (typeof c.topic !== 'string' || c.topic.trim().length === 0) {
      errors.push(`${prefix} Missing or invalid topic`);
    }

    const difficulty = typeof c.difficulty === 'string' ? c.difficulty : undefined;
    if (!difficulty || !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      errors.push(`${prefix} Invalid difficulty (must be Easy, Medium, or Hard)`);
    }

    if (!Array.isArray(c.expected_points)) {
      errors.push(`${prefix} expected_points must be an array`);
    }

    if (!Array.isArray(c.tags)) {
      errors.push(`${prefix} tags must be an array`);
    }

    const solution = c.solution;
    if (typeof solution !== 'object' || solution === null) {
      errors.push(`${prefix} Missing or invalid solution object`);
    } else {
      const sol = solution as Record<string, unknown>;
      if (!Array.isArray(sol.approaches) || (sol.approaches as unknown[]).length === 0) {
        errors.push(`${prefix} solution.approaches must be a non-empty array`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static generateCSVTemplate(): string {
    const headers = [
      'id',
      'topic',
      'title',
      'question',
      'hint',
      'expected_points',
      'solution_code',
      'time_complexity',
      'space_complexity',
      'explanation',
      'neetcode_url',
      'youtube_url',
      'difficulty',
      'tags',
    ];

    const sampleRow = [
      'two_sum',
      'Arrays',
      'Two Sum',
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      'Think about using a hash map to store complements',
      'Use hash map|Store complements|Check for target-num',
      'def twoSum(nums, target):\\n    hashmap = {}\\n    for i, num in enumerate(nums):\\n        complement = target - num\\n        if complement in hashmap:\\n            return [hashmap[complement], i]\\n        hashmap[num] = i\\n    return []',
      'O(n)',
      'O(n)',
      'We iterate through the array once, using a hash map to store each number and its index. For each number, we calculate its complement and check if it exists in our hash map.',
      'https://neetcode.io/problems/two-sum',
      'https://www.youtube.com/watch?v=KLlXCFG5TnA',
      'Easy',
      'Array|Hash Table|Two Pointers',
    ];

    return [headers.join(','), sampleRow.map((cell) => `"${cell}"`).join(',')].join('\n');
  }

  static downloadCSVTemplate() {
    const template = this.generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
