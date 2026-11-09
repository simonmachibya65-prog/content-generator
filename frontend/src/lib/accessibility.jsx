// Accessibility utilities and hooks

import { useEffect, useRef, useState } from 'react';

/**
 * Trap focus within a modal or dialog
 */
export const useFocusTrap = (isActive) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    firstElement?.focus();
    document.addEventListener('keydown', handleTab);

    return () => document.removeEventListener('keydown', handleTab);
  }, [isActive]);

  return containerRef;
};

/**
 * Handle escape key press
 */
export const useEscapeKey = (callback) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') callback();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [callback]);
};

/**
 * Lock body scroll (for modals)
 */
export const useLockBodyScroll = (lock) => {
  useEffect(() => {
    if (lock) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [lock]);
};

/**
 * Announce content to screen readers
 */
export const announce = (message, priority = 'polite') => {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority); // 'polite' or 'assertive'
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

/**
 * Generate unique IDs for ARIA labels
 */
let idCounter = 0;
export const useId = (prefix = 'id') => {
  const idRef = useRef(null);
  
  if (idRef.current === null) {
    idRef.current = `${prefix}-${++idCounter}`;
  }
  
  return idRef.current;
};

/**
 * Keyboard navigation for lists
 */
export const useKeyboardNavigation = (itemsCount, onSelect) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < itemsCount - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault();
          onSelect(activeIndex);
        }
        break;
      case 'Escape':
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  return { activeIndex, setActiveIndex, handleKeyDown };
};

/**
 * Skip to main content (for screen reader users)
 */
export const SkipToContent = ({ targetId = 'main-content' }) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg"
  >
    Skip to main content
  </a>
);

/**
 * Screen reader only text
 */
export const ScreenReaderOnly = ({ children }) => (
  <span className="sr-only">{children}</span>
);

/**
 * Accessible icon with label
 */
export const AccessibleIcon = ({ icon: Icon, label, decorative = false, ...props }) => (
  <>
    <Icon aria-hidden={decorative} {...props} />
    {!decorative && <span className="sr-only">{label}</span>}
  </>
);
