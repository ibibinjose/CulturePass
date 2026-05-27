import React from 'react';

// UI Components
export const KeyboardProvider = ({ children }) => children;
export const KeyboardAwareScrollView = ({ children, ...props }) => children;
export const KeyboardButton = ({ children }) => children;
export const KeyboardToolbar = () => null;
export const KeyboardStickyView = ({ children }) => children;
export const KeyboardAvoidingView = ({ children }) => children;

// Hooks
export const useKeyboardHandler = () => ({});
export const useReanimatedKeyboardAnimation = () => ({ height: { value: 0 }, progress: { value: 0 } });
export const useKeyboardController = () => ({ setEnabled: () => {}, setTextInputPointerEvents: () => {} });
export const useKeyboardContext = () => ({ state: { value: 0 }, height: { value: 0 } });
export const useKeyboardStatus = () => ({ isOpen: false, height: 0 });

// Native Module Mock
export const KeyboardControllerNative = {
  getConstants: () => ({}),
  addListener: () => {},
  removeListeners: () => {},
  dismiss: () => {},
  setWindowTranslucent: () => {},
  setKeyboardAllowed: () => {},
};

const KeyboardControllerStub = {
  KeyboardProvider,
  KeyboardAwareScrollView,
  KeyboardButton,
  KeyboardToolbar,
  KeyboardStickyView,
  KeyboardAvoidingView,
  useKeyboardHandler,
  useReanimatedKeyboardAnimation,
  useKeyboardController,
  useKeyboardContext,
  useKeyboardStatus,
  KeyboardControllerNative,
};

export default KeyboardControllerStub;
