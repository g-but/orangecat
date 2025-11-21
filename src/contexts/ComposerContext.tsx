'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ComposerContextType {
  isOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
}

const ComposerContext = createContext<ComposerContextType | undefined>(undefined);

export function ComposerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openComposer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeComposer = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ComposerContext.Provider value={{ isOpen, openComposer, closeComposer }}>
      {children}
    </ComposerContext.Provider>
  );
}

export function useComposer() {
  const context = useContext(ComposerContext);
  // Return default values if context not available (for graceful degradation)
  if (context === undefined) {
    return {
      isOpen: false,
      openComposer: () => {},
      closeComposer: () => {},
    };
  }
  return context;
}

