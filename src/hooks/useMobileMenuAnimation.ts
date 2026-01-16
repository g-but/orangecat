/**
 * Mobile Menu Animation Hook
 *
 * Manages mobile menu animation state and closing logic.
 * Extracted from Header component to follow SOC principle.
 *
 * Created: 2026-01-16
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface UseMobileMenuAnimationProps {
  /** Whether menu is open */
  isOpen: boolean;
  /** Callback to close menu */
  onClose: () => void;
  /** Animation duration in ms */
  animationDuration?: number;
}

/**
 * Hook to manage mobile menu animation state
 *
 * Handles:
 * - Closing animation state
 * - Click outside detection
 * - Escape key handling
 * - Cleanup on unmount
 *
 * @returns Object with refs and state for menu animation
 */
export function useMobileMenuAnimation({
  isOpen,
  onClose,
  animationDuration = 300,
}: UseMobileMenuAnimationProps) {
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle closing animation - keep backdrop and menu visible during animation
  useEffect(() => {
    if (!isOpen && isClosing) {
      // Clear any existing timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      // Wait for animation to complete
      closeTimeoutRef.current = setTimeout(() => {
        setIsClosing(false);
      }, animationDuration);
    } else if (isOpen) {
      setIsClosing(false);
    }

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen, isClosing, animationDuration]);

  // Handle closing with animation
  const handleClose = () => {
    setIsClosing(true);
    onClose();
  };

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return {
    /** Ref for menu element */
    menuRef,
    /** Ref for menu button */
    buttonRef,
    /** Whether menu is in closing animation */
    isClosing,
    /** Function to close menu with animation */
    handleClose,
  };
}
