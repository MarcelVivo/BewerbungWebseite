'use client';

import { createContext, useContext, type ReactNode } from 'react';

const EmbeddedFormContext = createContext(false);

export function EmbeddedForm({ children }: { children: ReactNode }) {
  return (
    <EmbeddedFormContext.Provider value>
      {children}
    </EmbeddedFormContext.Provider>
  );
}

export function useEmbeddedForm() {
  return useContext(EmbeddedFormContext);
}
