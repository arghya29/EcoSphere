import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  animationsDisabled: boolean;
  setAnimationsDisabled: (disabled: boolean) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      animationsDisabled: false,
      setAnimationsDisabled: (disabled) => set({ animationsDisabled: disabled }),
    }),
    {
      name: 'ecosphere-preferences',
    }
  )
);
