import {useCallback, useEffect, useRef, useState} from 'react';
import {simplifyText} from '../services/simplifyText';
import {
  SimplificationLevel,
  SimplifyError,
  SimplifyResponse,
} from '../types/simplify';

type SimplifyState = {
  loading: boolean;
  error: string | null;
  result: SimplifyResponse | null;
};

/**
 * Reusable hook to simplify text with loading, error and optional debouncing support.
 */
export const useSimplifyText = (userId: string) => {
  const [state, setState] = useState<SimplifyState>({
    loading: false,
    error: null,
    result: null,
  });
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const runSimplification = useCallback(
    async (text: string, level: SimplificationLevel) => {
      setState(prev => ({...prev, loading: true, error: null}));

      try {
        const result = await simplifyText(text, {targetLevel: level, userId});
        setState({loading: false, error: null, result});
        return result;
      } catch (error) {
        const message =
          error instanceof SimplifyError
            ? error.message
            : 'Something went wrong. Please try again';
        setState(prev => ({...prev, loading: false, error: message}));
        throw error;
      }
    },
    [userId],
  );

  const runSimplificationDebounced = useCallback(
    (text: string, level: SimplificationLevel, delayMs = 500) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        runSimplification(text, level).catch(() => null);
      }, delayMs);
    },
    [runSimplification],
  );

  const clearResult = useCallback(() => {
    setState({loading: false, error: null, result: null});
  }, []);

  return {
    ...state,
    runSimplification,
    runSimplificationDebounced,
    clearResult,
  };
};
