import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ArtifactItem } from "../ai/types";

/** 持久化 schema 版本，变更字段结构时递增并补 migrate 分支 */
const ARTIFACTS_PERSIST_VERSION = 1;

interface ArtifactsState {
  activeArtifact: ArtifactItem | null;
  isOpen: boolean;
  viewMode: "preview" | "code";
  artifactsList: ArtifactItem[];

  openArtifact: (artifact: ArtifactItem) => void;
  closeArtifact: () => void;
  togglePanel: () => void;
  setViewMode: (mode: "preview" | "code") => void;
  saveArtifact: (artifact: ArtifactItem) => void;
  switchVersion: (versionNum: number) => void;
  removeArtifact: (id: string) => void;
}

export const useArtifactsStore = create<ArtifactsState>()(
  persist(
    (set, get) => ({
      activeArtifact: null,
      isOpen: false,
      viewMode: "preview",
      artifactsList: [],

      openArtifact: (artifact) => {
        set((state) => {
          const exists = state.artifactsList.find((a) => a.id === artifact.id);
          const updatedList = exists
            ? state.artifactsList.map((a) => (a.id === artifact.id ? artifact : a))
            : [artifact, ...state.artifactsList];

          return {
            activeArtifact: artifact,
            isOpen: true,
            artifactsList: updatedList,
          };
        });
      },

      closeArtifact: () => set({ isOpen: false }),

      /**
       * 面板开合状态不持久化，重启后为关闭。
       * 因此重新打开时要能自动回落到最近一个 artifact，
       * 否则「开了但什么都看不到」。
       */
      togglePanel: () =>
        set((state) => {
          if (state.isOpen) return { isOpen: false };

          const target = state.activeArtifact ?? state.artifactsList[0];
          if (!target) return state;

          return { isOpen: true, activeArtifact: target };
        }),

      setViewMode: (viewMode) => set({ viewMode }),

      saveArtifact: (artifact) => {
        set((state) => {
          const existingIndex = state.artifactsList.findIndex((a) => a.id === artifact.id);
          let newList: ArtifactItem[];
          if (existingIndex >= 0) {
            newList = [...state.artifactsList];
            newList[existingIndex] = artifact;
          } else {
            newList = [artifact, ...state.artifactsList];
          }

          return {
            artifactsList: newList,
            activeArtifact:
              state.activeArtifact?.id === artifact.id ? artifact : state.activeArtifact,
          };
        });
      },

      switchVersion: (versionNum) => {
        const { activeArtifact } = get();
        if (!activeArtifact) return;

        const targetVersion = activeArtifact.versions.find((v) => v.version === versionNum);
        if (!targetVersion) return;

        const updated: ArtifactItem = {
          ...activeArtifact,
          currentVersion: versionNum,
          content: targetVersion.content,
        };

        get().saveArtifact(updated);
      },

      removeArtifact: (id) => {
        set((state) => ({
          artifactsList: state.artifactsList.filter((a) => a.id !== id),
          activeArtifact: state.activeArtifact?.id === id ? null : state.activeArtifact,
          isOpen: state.activeArtifact?.id === id ? false : state.isOpen,
        }));
      },
    }),
    {
      name: "claude-desktop-artifacts",
      version: ARTIFACTS_PERSIST_VERSION,
      /** 面板开合属于瞬时 UI 状态，不落盘 */
      partialize: (state) => ({ artifactsList: state.artifactsList }),
      /** 显式返回落盘字段，不用 `as` 把「部分快照」断言成完整 State */
      migrate: (persisted) => {
        const snapshot = persisted as { artifactsList?: ArtifactItem[] } | undefined;

        return {
          artifactsList: Array.isArray(snapshot?.artifactsList) ? snapshot.artifactsList : [],
        };
      },
    },
  ),
);
