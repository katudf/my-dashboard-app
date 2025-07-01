// src/contexts/UIStateContext.tsx
import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useCallback } from 'react';

// 各モーダルが必要とするデータ型を個別に定義
interface ProjectModalData { type: 'project'; data: { id: string | null }; }
interface WorkerModalData { type: 'worker'; data: { id: string | null }; }
interface AssignmentModalData { type: 'assignment'; data: { cellKey: string }; }
interface AiModalData { type: 'ai'; data: { type: 'task' | 'memo' | 'risk'; [key: string]: any }; }

// それらをまとめた型
type ModalState = ProjectModalData | WorkerModalData | AssignmentModalData | AiModalData | { type: null; data: null };

interface UIState {
  modal: ModalState;
  notification: { message: string; type: 'success' | 'error'; } | null;
  confirmation: { message:string; onConfirm: () => void; } | null;
}

interface UIStateContextType {
  uiState: UIState;
  // この型定義で、呼び出し元の安全性を確保する
  openModal: <T extends ModalState['type']>(
    type: T,
    data: Extract<ModalState, { type: T }>['data']
  ) => void;
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

  // ★修正点: openModalの実装をシンプルにする
  // これで、Contextのvalueに代入する際の方のエラーが解消される
  const openModal = useCallback((type: ModalState['type'], data: ModalState['data']) => {
    // アサーションを使って、stateの型を正しく伝える
    setUiState(s => ({ ...s, modal: { type, data } as ModalState }));
  }, []);

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
