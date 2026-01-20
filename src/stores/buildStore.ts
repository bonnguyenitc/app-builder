import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { BuildHistory } from '../types/project';

interface BuildState {
  activeBuilds: Record<string, BuildHistory>; // Key: projectId
  buildHistory: BuildHistory[];
  isLoading: boolean;
  fetchHistory: () => Promise<void>;
  updateBuild: (projectId: string, updater: (prev: BuildHistory) => BuildHistory) => void;
  startBuild: (projectId: string, build: BuildHistory) => void;
  addToHistory: (build: BuildHistory) => void;
  clearActive: (projectId: string) => void;
}

export const useBuildStore = create<BuildState>((set) => ({
  activeBuilds: {},
  buildHistory: [],
  isLoading: false,

  fetchHistory: async () => {
    set({ isLoading: true });
    try {
      const buildHistory = await invoke<BuildHistory[]>('list_build_history');
      set({ buildHistory, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch history', e);
      set({ isLoading: false });
    }
  },

  updateBuild: (projectId, updater) =>
    set((state) => {
      const current = state.activeBuilds[projectId];
      if (!current) return state;
      return {
        activeBuilds: { ...state.activeBuilds, [projectId]: updater(current) },
      };
    }),
  startBuild: (projectId, build) =>
    set((state) => ({
      activeBuilds: { ...state.activeBuilds, [projectId]: build },
    })),
  addToHistory: (build) =>
    set((state) => ({
      buildHistory: [build, ...state.buildHistory],
    })),
  clearActive: (projectId) =>
    set((state) => {
      const newActive = { ...state.activeBuilds };
      delete newActive[projectId];
      return { activeBuilds: newActive };
    }),
}));
