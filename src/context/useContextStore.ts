import { create } from 'zustand';
import type { SelectedElementContext } from '../context/types/context.types';
import type { ParsedBuildError } from '../lib/parseBuildErrors';

interface ScreenshotCache {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png';
  caption: string;
  capturedAt: number;
}

interface ContextStore {
  selection: SelectedElementContext | null;
  setSelection: (selection: SelectedElementContext | null) => void;
  consoleErrors: string[];
  addConsoleError: (error: string) => void;
  clearConsoleErrors: () => void;
  buildErrors: ParsedBuildError[];
  setBuildErrors: (errors: ParsedBuildError[]) => void;
  addBuildError: (error: ParsedBuildError) => void;
  designScreenshot: ScreenshotCache | null;
  setDesignScreenshot: (screenshot: ScreenshotCache | null) => void;
  designProfileVersion: number;
  bumpDesignProfileVersion: () => void;
}

export const useContextStore = create<ContextStore>((set) => ({
  selection: null,
  setSelection: (selection) => set({ selection }),
  consoleErrors: [],
  addConsoleError: (error) =>
    set((state) => ({
      consoleErrors: [...state.consoleErrors.slice(-20), error],
    })),
  clearConsoleErrors: () => set({ consoleErrors: [] }),
  buildErrors: [],
  setBuildErrors: (errors) => set({ buildErrors: errors }),
  addBuildError: (error) =>
    set((state) => ({
      buildErrors: [...state.buildErrors.slice(-10), error],
    })),
  designScreenshot: null,
  setDesignScreenshot: (screenshot) => set({ designScreenshot: screenshot }),
  designProfileVersion: 0,
  bumpDesignProfileVersion: () =>
    set((state) => ({ designProfileVersion: state.designProfileVersion + 1 })),
}));
