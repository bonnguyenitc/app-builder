import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { BuildHistory } from '../types/project';

// Composite key: "{projectId}_{platform}" allows iOS and Android builds to coexist
const buildKey = (projectId: string, platform: string) => `${projectId}_${platform}`;

interface BuildState {
  activeBuilds: Record<string, BuildHistory>; // Key: "{projectId}_{platform}"
  buildHistory: BuildHistory[];
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  selectedProjectId: string | null;
  fetchHistory: (page?: number, pageSize?: number, projectId?: string | null) => Promise<void>;
  updateBuild: (key: string, updater: (prev: BuildHistory) => BuildHistory) => void;
  startBuild: (key: string, build: BuildHistory) => void;
  addToHistory: (build: BuildHistory) => void;
  clearActive: (key: string) => void;
  cancelBuild: (projectId: string, platform: string) => Promise<void>;
  getActiveBuildForPlatform: (projectId: string, platform: string) => BuildHistory | undefined;
  hasActiveBuilds: (projectId: string) => boolean;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  activeBuilds: {},
  buildHistory: [],
  isLoading: false,
  currentPage: 1,
  pageSize: 20,
  totalItems: 0,
  selectedProjectId: null,

  fetchHistory: async (page, pageSize, projectId) => {
    const currentPage = page || get().currentPage;
    const currentPageSize = pageSize || get().pageSize;
    const currentProjectId = projectId !== undefined ? projectId : get().selectedProjectId;

    set({ isLoading: true });
    try {
      const response = await invoke<{ items: BuildHistory[]; total: number }>(
        'list_build_history',
        {
          page: currentPage,
          pageSize: currentPageSize,
          projectId: currentProjectId,
        },
      );
      set({
        buildHistory: response.items,
        totalItems: response.total,
        currentPage: currentPage,
        pageSize: currentPageSize,
        selectedProjectId: currentProjectId,
        isLoading: false,
      });
    } catch (e) {
      console.error('Failed to fetch history', e);
      set({ isLoading: false });
    }
  },

  updateBuild: (key, updater) =>
    set((state) => {
      const current = state.activeBuilds[key];
      if (!current) return state;
      return {
        activeBuilds: { ...state.activeBuilds, [key]: updater(current) },
      };
    }),
  startBuild: (key, build) =>
    set((state) => ({
      activeBuilds: { ...state.activeBuilds, [key]: build },
    })),
  addToHistory: (build) =>
    set((state) => {
      const matchesFilter = !state.selectedProjectId || build.projectId === state.selectedProjectId;
      if (!matchesFilter) {
        return { totalItems: state.totalItems + 1 };
      }
      return {
        buildHistory: [build, ...state.buildHistory],
        totalItems: state.totalItems + 1,
      };
    }),
  clearActive: (key) =>
    set((state) => {
      const newActive = { ...state.activeBuilds };
      delete newActive[key];
      return { activeBuilds: newActive };
    }),
  cancelBuild: async (projectId, platform) => {
    const key = buildKey(projectId, platform);
    try {
      await invoke('cancel_build_process', { projectId, platform });

      set((state) => {
        const build = state.activeBuilds[key];
        if (build) {
          const cancelledBuild: BuildHistory = {
            ...build,
            status: 'failed',
            logs: build.logs + '\n\n❌ Build cancelled by user',
          };

          const newActive = { ...state.activeBuilds };
          delete newActive[key];

          return {
            activeBuilds: newActive,
            buildHistory: [cancelledBuild, ...state.buildHistory],
          };
        }
        return state;
      });
    } catch (error) {
      console.error('Failed to cancel build process:', error);
    }
  },

  getActiveBuildForPlatform: (projectId, platform) => {
    return get().activeBuilds[buildKey(projectId, platform)];
  },

  hasActiveBuilds: (projectId) => {
    const active = get().activeBuilds;
    return !!active[buildKey(projectId, 'ios')] || !!active[buildKey(projectId, 'android')];
  },
}));

export { buildKey };
