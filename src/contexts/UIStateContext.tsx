import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import type { Project, Worker } from '../lib/types';

type ModalType = 'project' | 'worker' | 'assignment';
type ModalData = { id: string } | { cellKey: string };

interface UIState {
  modal: {
    type: ModalType | null;
    data: ModalData | null;
  };
  notification: {
    message: string;
    type: 'success' | 'error';
  } | null;
  confirmation: {
    message: string;
    onConfirm: () => void;
  } | null;
}

interface UIStateContextType {
  uiState: UIState;
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  hideNotification: () => void;
  requestConfirmation: (message: string, onConfirm: () => void) => void;
  closeConfirmation: () => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uiState, setUiState] = useState<UIState>({
    modal: { type: null, data: null },
    notification: null,
    confirmation: null,
  });

  const openModal = useCallback((type: ModalType, data: ModalData | null = null) => setUiState(s => ({ ...s, modal: { type, data } })), []);
  const closeModal = useCallback(() => setUiState(s => ({ ...s, modal: { type: null, data: null } })), []);
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => setUiState(s => ({ ...s, notification: { message, type } })), []);
  const hideNotification = useCallback(() => setUiState(s => ({ ...s, notification: null })), []);
  const requestConfirmation = useCallback((message: string, onConfirm: () => void) => setUiState(s => ({ ...s, confirmation: { message, onConfirm } })), []);
  const closeConfirmation = useCallback(() => setUiState(s => ({ ...s, confirmation: null })), []);

  const value = { uiState, openModal, closeModal, showNotification, hideNotification, requestConfirmation, closeConfirmation };

  return (
    <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>
  );
};

