import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '../stores/projectStore';

export interface Emulator {
  id: string;
  name: string;
  platform: 'android' | 'ios';
  state: 'Booted' | 'Shutdown';
  version: string;
}

export const useEmulators = () => {
  const [emulators, setEmulators] = useState<Emulator[]>([]);
  const [loading, setLoading] = useState(false);
  const { projects } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await invoke<Emulator[]>('list_emulators');
      setEmulators(list);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      invoke<Emulator[]>('list_emulators').then(setEmulators).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = async (em: Emulator) => {
    setLaunchingId(em.id);
    try {
      await invoke('launch_emulator', { id: em.id, platform: em.platform });
      setTimeout(refresh, 2000);
      setTimeout(refresh, 5000);
    } catch (e) {
      alert('Failed to launch: ' + e);
    }
    setTimeout(() => setLaunchingId(null), 2000);
  };

  const handleRunApp = async (em: Emulator) => {
    if (!selectedProjectId) {
      alert('Please select a project first to run.');
      return;
    }
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;

    try {
      await invoke('run_app_on_emulator', {
        projectPath: project.path,
        platform: em.platform,
        deviceId: em.id,
        deviceName: em.name,
      });
    } catch (e) {
      alert('Failed to run app: ' + e);
    }
  };

  return {
    emulators,
    loading,
    selectedProjectId,
    setSelectedProjectId,
    launchingId,
    refresh,
    handleLaunch,
    handleRunApp,
  };
};
