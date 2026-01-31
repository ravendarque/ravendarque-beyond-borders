import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook for managing focus programmatically
 *
 * Provides utilities for setting focus, managing focus order,
 * and handling focus restoration.
 *
 * @returns Focus management utilities
 *
 * @example
 * ```tsx
 * const { focusRef, setFocus } = useFocusManagement();
 *
 * // Attach ref to element
 * <button ref={focusRef}>Click me</button>
 *
 * // Focus the element programmatically
 * useEffect(() => {
 *   if (someCondition) {
 *     setFocus();
 *   }
 * }, [someCondition, setFocus]);
 * ```
 */
export function useFocusManagement<T extends HTMLElement = HTMLElement>() {
  const elementRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Set focus to the referenced element
   * @param options Focus options
   */
  const setFocus = useCallback((options?: FocusOptions) => {
    if (elementRef.current) {
      elementRef.current.focus(options);
    }
  }, []);

  /**
   * Save the currently focused element
   */
  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  /**
   * Restore focus to the previously saved element
   */
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  /**
   * Focus the first focusable element within a container
   * @param container The container to search within
   */
  const focusFirstIn = useCallback((container: HTMLElement | null) => {
    if (!container) return;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();
  }, []);

  return {
    /** Ref to attach to the element to be focused */
    focusRef: elementRef,
    /** Function to set focus to the referenced element */
    setFocus,
    /** Function to save the currently focused element */
    saveFocus,
    /** Function to restore focus to previously saved element */
    restoreFocus,
    /** Function to focus the first focusable element in a container */
    focusFirstIn,
  };
}

/**
 * Hook to trap focus within a container (for modals, dialogs, etc.)
 *
 * @param isActive Whether focus trapping is currently active
 * @returns Ref to attach to the container element
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * const trapRef = useFocusTrap(isOpen);
 *
 * return (
 *   <div ref={trapRef}>
 *     {isOpen && <Modal>...</Modal>}
 *   </div>
 * );
 * ```
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector),
      );

      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      // Shift + Tab on first element -> focus last
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
      // Tab on last element -> focus first
      else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}
