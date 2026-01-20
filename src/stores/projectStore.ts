import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Project } from '../types/project';

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  addProject: (project: Project) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const projects = await invoke<Project[]>('list_projects');
      set({ projects, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).toString(), isLoading: false });
    }
  },

  addProject: async (project) => {
    try {
      await invoke('save_project', { project });
      set((state) => ({ projects: [...state.projects, project] }));
    } catch (e) {
      set({ error: (e as Error).toString() });
    }
  },

  updateProject: async (id, updates) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const updatedProject = { ...project, ...updates };
    try {
      await invoke('save_project', { project: updatedProject });
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
      }));
    } catch (e) {
      set({ error: (e as Error).toString() });
    }
  },

  deleteProject: async (id) => {
    try {
      await invoke('delete_project', { id });
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
      }));
    } catch (e) {
      set({ error: (e as Error).toString() });
    }
  },

  selectProject: (id) => set({ selectedProjectId: id }),
}));
