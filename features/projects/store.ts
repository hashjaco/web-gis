"use client";

import { create } from "zustand";

interface ActiveProject {
  id: string;
  name: string;
}

interface ProjectStoreState {
  activeProject: ActiveProject | null;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: number | null;
  setActiveProject: (project: ActiveProject | null) => void;
  markDirty: () => void;
  markSaving: () => void;
  markSaved: () => void;
  clearProject: () => void;
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
  activeProject: null,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  setActiveProject: (project) =>
    set({ activeProject: project, isDirty: false, lastSavedAt: null }),
  markDirty: () => set({ isDirty: true }),
  markSaving: () => set({ isSaving: true }),
  markSaved: () =>
    set({ isDirty: false, isSaving: false, lastSavedAt: Date.now() }),
  clearProject: () =>
    set({
      activeProject: null,
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
    }),
}));
