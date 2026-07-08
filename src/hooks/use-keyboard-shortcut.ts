import { useEffect, useRef } from 'react';

type KeyType = 'Enter' | 'Escape' | 'F5' | string;

interface UseKeyboardShortcutOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
  /**
   * Eğer true ise, textarea gibi çok satırlı inputlarda Enter tuşuna basıldığında tetiklenmez.
   * Varsayılan olarak true'dur.
   */
  ignoreTextarea?: boolean;
}

export const useKeyboardShortcut = (
  keys: KeyType | KeyType[],
  callback: (event: KeyboardEvent) => void,
  options: UseKeyboardShortcutOptions = {}
) => {
  const callbackRef = useRef(callback);
  
  const { 
    preventDefault = false, 
    stopPropagation = false, 
    disabled = false,
    ignoreTextarea = true 
  } = options;

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      
      if (keyList.includes(event.key)) {
        // Textarea içinde Enter'a basıldığında ve ignoreTextarea true ise işlemi iptal et
        if (event.key === 'Enter' && ignoreTextarea) {
          const activeElement = document.activeElement;
          if (activeElement?.tagName === 'TEXTAREA') {
            return;
          }
        }

        if (preventDefault) {
          event.preventDefault();
        }

        if (stopPropagation) {
          event.stopPropagation();
        }

        callbackRef.current(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keys, preventDefault, stopPropagation, disabled, ignoreTextarea]);
};
