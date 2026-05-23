/**
 * useAIAssist Hook
 * 
 * Provides AI text assistance functionality for form fields.
 * Supports operations: Improve Writing, Make Professional, Expand, Shorten, Change Tone
 * 
 * Requirements: 5, 11
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export type AIOperation = 
  | 'improve' 
  | 'professional' 
  | 'expand' 
  | 'shorten' 
  | 'tone-friendly'
  | 'tone-professional'
  | 'tone-enthusiastic'
  | 'tone-formal';

export type FieldType = 'tagline' | 'description' | 'guidelines';

export interface AIAssistResult {
  originalText: string;
  suggestedText: string;
  operation: AIOperation;
  readabilityScore?: number;
}

export interface UseAIAssistReturn {
  isLoading: boolean;
  error: string | null;
  result: AIAssistResult | null;
  processText: (text: string, operation: AIOperation, fieldType: FieldType) => Promise<void>;
  clearResult: () => void;
  calculateReadability: (text: string) => number;
}

/**
 * Calculate Flesch-Kincaid readability score
 * Score ranges: 90-100 (very easy), 60-70 (standard), 0-30 (very difficult)
 * Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
 */
function calculateFleschKincaid(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  // Count sentences (periods, exclamation marks, question marks)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  
  // Count words
  const words = text.split(/\s+/).filter(w => w.length > 0).length || 1;
  
  // Estimate syllables (simplified: count vowel groups)
  const syllables = text
    .toLowerCase()
    .split(/\s+/)
    .reduce((count, word) => {
      const vowelGroups = word.match(/[aeiouy]+/g);
      return count + (vowelGroups ? vowelGroups.length : 1);
    }, 0);

  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function useAIAssist(): UseAIAssistReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIAssistResult | null>(null);

  const processText = useCallback(async (
    text: string,
    operation: AIOperation,
    fieldType: FieldType
  ) => {
    if (!text || text.trim().length === 0) {
      setError('Please enter some text first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call AI service API
      const response = await api.ai.assist({
        text,
        operation,
        fieldType,
      });

      const readabilityScore = fieldType === 'description' 
        ? calculateFleschKincaid(response.suggestedText)
        : undefined;

      setResult({
        originalText: text,
        suggestedText: response.suggestedText,
        operation,
        readabilityScore,
      });
    } catch (err: any) {
      console.error('AI assist error:', err);
      setError(err.message || 'Failed to process text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const calculateReadability = useCallback((text: string): number => {
    return calculateFleschKincaid(text);
  }, []);

  return {
    isLoading,
    error,
    result,
    processText,
    clearResult,
    calculateReadability,
  };
}
