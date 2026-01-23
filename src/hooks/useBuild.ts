import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useBuildStore } from '../stores/buildStore';
import { Project, BuildHistory } from '../types/project';

export const useBuild = () => {
  const { updateBuild, startBuild: startBuildStore, addToHistory, clearActive } = useBuildStore();

  const startBuild = useCallback(
    async (
      project: Project,
      platform: 'ios' | 'android',
      options?: { uploadToAppStore?: boolean; releaseNote?: string },
    ) => {
      const buildId = Math.random().toString(36).substr(2, 9);
      const initialBuild: BuildHistory = {
        id: buildId,
        projectId: project.id,
        platform,
        version: platform === 'ios' ? project.ios.version : project.android.version,
        buildNumber: platform === 'ios' ? project.ios.buildNumber : project.android.versionCode,
        status: 'building',
        timestamp: Date.now(),
        logs: `Starting ${platform} build for ${project.name}...\n`,
        releaseNote: options?.releaseNote || '',
      };

      // Use a temporary record in buildStore
      startBuildStore(project.id, initialBuild);

      // Initial log update in case the store update hasn't settled
      const unlistenLogs = await listen<string>('build-log', (event) => {
        updateBuild(project.id, (prev) => ({
          ...prev,
          logs: prev.logs + event.payload + '\n',
        }));
      });

      const unlistenLogFile = await listen<string>('build-log-file', (event) => {
        updateBuild(project.id, (prev) => ({
          ...prev,
          logFilePath: event.payload,
        }));
      });

      const unlistenStatus = await listen<'success' | 'failed'>('build-status', async (event) => {
        // Get the current build state from the store to ensure we have all logs
        const currentBuild = useBuildStore.getState().activeBuilds[project.id];
        if (!currentBuild) return;

        const finalBuild: BuildHistory = {
          ...currentBuild,
          status: event.payload,
          timestamp: Date.now(),
        };

        clearActive(project.id);
        addToHistory(finalBuild);

        try {
          await invoke('save_build_history', { history: finalBuild });
        } catch (e) {
          console.error('Failed to save build history', e);
        }

        unlistenLogs();
        unlistenLogFile();
        unlistenStatus();
      });

      try {
        await invoke('build_project', { project, platform, options });
      } catch (e) {
        console.error('Build command failed', e);
        const currentBuild = useBuildStore.getState().activeBuilds[project.id];
        if (currentBuild) {
          const failedBuild: BuildHistory = {
            ...currentBuild,
            status: 'failed',
            logs: currentBuild.logs + `Error: ${e}\n`,
            timestamp: Date.now(),
          };
          clearActive(project.id);
          addToHistory(failedBuild);
          try {
            await invoke('save_build_history', { history: failedBuild });
          } catch (e) {
            console.error('Failed to save build history', e);
          }
        }
        unlistenLogs();
        unlistenLogFile();
        unlistenStatus();
      }
    },
    [updateBuild, addToHistory, clearActive],
  );

  return { startBuild };
};
