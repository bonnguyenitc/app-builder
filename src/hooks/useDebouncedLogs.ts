import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to debounce log updates
 * Prevents excessive re-renders when logs update rapidly
 */
export function useDebouncedLogs(logs: string, delay: number = 500) {
  const [debouncedLogs, setDebouncedLogs] = useState<string>(logs);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = window.setTimeout(() => {
      setDebouncedLogs(logs);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [logs, delay]);

  return debouncedLogs;
}
