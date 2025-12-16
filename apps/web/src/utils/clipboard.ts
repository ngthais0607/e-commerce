/**
 * Clipboard utilities
 * Provides functions for copying text to clipboard
 */

/**
 * Copy text to clipboard
 * 
 * @param text - Text to copy
 * @returns Promise that resolves when text is copied
 * 
 * @example
 * await copyToClipboard('Hello World');
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    // Fallback for older browsers
    return fallbackCopyToClipboard(text);
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return fallbackCopyToClipboard(text);
  }
}

/**
 * Fallback copy method for older browsers
 */
function fallbackCopyToClipboard(text: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    document.body.removeChild(textArea);
    return false;
  }
}

/**
 * Read text from clipboard
 * 
 * @returns Promise that resolves with clipboard text
 * 
 * @example
 * const text = await readFromClipboard();
 */
export async function readFromClipboard(): Promise<string> {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API not supported');
  }

  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    throw error;
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardSupported(): boolean {
  return !!navigator.clipboard;
}

import React from 'react';

/**
 * React hook for copying to clipboard with feedback
 */
export function useClipboard() {
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const copy = React.useCallback(async (text: string, duration: number = 2000) => {
    try {
      const success = await copyToClipboard(text);
      if (success) {
        setCopied(true);
        setError(null);
        setTimeout(() => setCopied(false), duration);
      } else {
        throw new Error('Failed to copy to clipboard');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setCopied(false);
    }
  }, []);

  return {
    copy,
    copied,
    error,
    isSupported: isClipboardSupported(),
  };
}

