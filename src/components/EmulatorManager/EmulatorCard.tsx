import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import {
  PlayIcon,
  SmartphoneIcon,
  LinkIcon,
  MoreVerticalIcon,
  TrashIcon,
  EraserIcon,
  RefreshCwIcon,
  ScrollTextIcon,
  CameraIcon,
  StopCircleIcon,
  VideoIcon,
} from '../Icons';
import { Emulator } from '../../hooks/useEmulators';

interface EmulatorCardProps {
  emulator: Emulator;
  onLaunch: (e: Emulator) => void;
  onRun: (e: Emulator) => void;
  onDeepLink: (e: Emulator) => void;
  isLaunching: boolean;
  canRun: boolean;
  selectedPackageName?: string;
}

export const EmulatorCard: React.FC<EmulatorCardProps> = ({
  emulator,
  onLaunch,
  onRun,
  onDeepLink,
  isLaunching,
  canRun,
  selectedPackageName,
}) => {
  const isBooted = emulator.state === 'Booted';
  const isAndroid = emulator.platform === 'android';
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [toolLoading, setToolLoading] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const checkRecordingStatus = async () => {
    try {
      const recording = await invoke<boolean>('is_device_recording', { deviceId: emulator.id });
      setIsRecording(recording);
    } catch (e) {
      console.error('Failed to check recording status:', e);
    }
  };

  useEffect(() => {
    if (isBooted) {
      checkRecordingStatus();
      const interval = setInterval(checkRecordingStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isBooted, emulator.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmulatorAction = async (action: string) => {
    if (
      !selectedPackageName &&
      !['screenshot', 'erase', 'record_start', 'record_stop'].includes(action)
    ) {
      alert('Please select a project first');
      return;
    }

    setToolLoading(action);
    try {
      if (action === 'record_start') {
        const filePath = await save({
          defaultPath: `recording_${emulator.platform}_${Date.now()}.mp4`,
          filters: [{ name: 'MPEG4 Video', extensions: ['mp4'] }],
        });
        if (filePath) {
          await invoke('start_recording', {
            deviceId: emulator.id,
            platform: emulator.platform,
            savePath: filePath,
          });
          setIsRecording(true);
        }
      } else if (action === 'record_stop') {
        const savedPath = await invoke<string>('stop_recording', { deviceId: emulator.id });
        setIsRecording(false);
        setTimeout(() => alert(`Recording saved successfully to: ${savedPath}`), 500);
      } else if (isAndroid) {
        switch (action) {
          case 'uninstall':
            await invoke('adb_uninstall_app', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            break;
          case 'clearData':
            await invoke('adb_clear_app_data', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            break;
          case 'forceStop':
            await invoke('adb_force_stop_app', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            break;
          case 'restart':
            await invoke('adb_restart_app', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            break;
          case 'logcat':
            await invoke('adb_open_logcat', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            break;
          case 'screenshot':
            const f1 = await save({
              defaultPath: `screenshot_${Date.now()}.png`,
              filters: [{ name: 'PNG Image', extensions: ['png'] }],
            });
            if (f1) {
              await invoke('adb_take_screenshot', { deviceId: emulator.id, savePath: f1 });
            }
            break;
        }
      } else {
        // iOS
        switch (action) {
          case 'uninstall':
            await invoke('simctl_uninstall_app', {
              deviceId: emulator.id,
              bundleId: selectedPackageName,
            });
            break;
          case 'forceStop':
            await invoke('simctl_terminate_app', {
              deviceId: emulator.id,
              bundleId: selectedPackageName,
            });
            break;
          case 'restart':
            await invoke('simctl_restart_app', {
              deviceId: emulator.id,
              bundleId: selectedPackageName,
            });
            break;
          case 'screenshot':
            const f2 = await save({
              defaultPath: `screenshot_ios_${Date.now()}.png`,
              filters: [{ name: 'PNG Image', extensions: ['png'] }],
            });
            if (f2) {
              await invoke('simctl_take_screenshot', { deviceId: emulator.id, savePath: f2 });
            }
            break;
          case 'erase':
            await invoke('simctl_erase_device', { deviceId: emulator.id });
            break;
        }
      }
    } catch (e) {
      alert(`Error: ${e}`);
    } finally {
      setToolLoading(null);
      setShowToolsMenu(false);
    }
  };

  const toolsMenuItems = isAndroid
    ? [
        {
          id: 'restart',
          icon: <RefreshCwIcon size={14} />,
          label: 'Restart App',
          color: 'var(--color-primary)',
        },
        {
          id: 'forceStop',
          icon: <StopCircleIcon size={14} />,
          label: 'Force Stop',
          color: 'var(--color-warning)',
        },
        {
          id: 'clearData',
          icon: <EraserIcon size={14} />,
          label: 'Clear App Data',
          color: 'var(--color-warning)',
        },
        {
          id: 'uninstall',
          icon: <TrashIcon size={14} />,
          label: 'Uninstall App',
          color: 'var(--color-error)',
        },
        { id: 'divider' },
        {
          id: isRecording ? 'record_stop' : 'record_start',
          icon: <VideoIcon size={14} />,
          label: isRecording ? 'Stop Recording' : 'Record Screen',
          color: isRecording ? 'var(--color-error)' : 'var(--color-text-primary)',
        },
        {
          id: 'logcat',
          icon: <ScrollTextIcon size={14} />,
          label: 'View Logcat',
          color: 'var(--color-text-primary)',
        },
        {
          id: 'screenshot',
          icon: <CameraIcon size={14} />,
          label: 'Take Screenshot',
          color: 'var(--color-text-primary)',
        },
      ]
    : [
        {
          id: 'restart',
          icon: <RefreshCwIcon size={14} />,
          label: 'Restart App',
          color: 'var(--color-primary)',
        },
        {
          id: 'forceStop',
          icon: <StopCircleIcon size={14} />,
          label: 'Terminate App',
          color: 'var(--color-warning)',
        },
        {
          id: 'uninstall',
          icon: <TrashIcon size={14} />,
          label: 'Uninstall App',
          color: 'var(--color-error)',
        },
        { id: 'divider' },
        {
          id: isRecording ? 'record_stop' : 'record_start',
          icon: <VideoIcon size={14} />,
          label: isRecording ? 'Stop Recording' : 'Record Screen',
          color: isRecording ? 'var(--color-error)' : 'var(--color-text-primary)',
        },
        {
          id: 'screenshot',
          icon: <CameraIcon size={14} />,
          label: 'Take Screenshot',
          color: 'var(--color-text-primary)',
        },
        {
          id: 'erase',
          icon: <EraserIcon size={14} />,
          label: 'Wipe Device',
          color: 'var(--color-error)',
        },
      ];

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderRadius: '20px',
        border: '1px solid var(--color-border)',
        overflow: 'visible',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: showToolsMenu ? 100 : 1,
        background: isBooted
          ? 'linear-gradient(135deg, var(--color-card) 0%, rgba(52, 199, 89, 0.03) 100%)'
          : 'var(--color-card)',
        boxShadow: isBooted ? '0 8px 32px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div style={{ flex: 1, overflow: 'hidden', marginRight: '16px' }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: '15px',
            marginBottom: '6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          title={emulator.name}
        >
          {emulator.name}
          {isRecording && (
            <span
              className="animate-pulse"
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--color-error)',
                display: 'inline-block',
                boxShadow: '0 0 8px var(--color-error)',
              }}
            />
          )}
        </div>
        <div
          style={{
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isBooted ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                boxShadow: isBooted ? '0 0 6px var(--color-success)' : 'none',
              }}
            />
            <span
              style={{
                color: isBooted ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '11px',
                letterSpacing: '0.02em',
              }}
            >
              {isLaunching ? 'Booting...' : emulator.state}
            </span>
          </div>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
            • {emulator.version}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        {!isBooted ? (
          <button
            className="btn btn-secondary"
            onClick={() => onLaunch(emulator)}
            disabled={isLaunching}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '12px',
              background: 'var(--color-sidebar)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <PlayIcon size={16} />
            <span>{isLaunching ? 'Booting' : 'Boot'}</span>
          </button>
        ) : (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => onDeepLink(emulator)}
              style={{ height: '40px', width: '40px', padding: 0, borderRadius: '12px' }}
              title="Deep Link"
            >
              <LinkIcon size={18} />
            </button>
            <button
              className="btn btn-primary"
              onClick={() => onRun(emulator)}
              disabled={!canRun}
              style={{
                height: '40px',
                padding: '0 16px',
                borderRadius: '12px',
                opacity: canRun ? 1 : 0.4,
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
              }}
            >
              <SmartphoneIcon size={16} />
              <span style={{ fontWeight: 700 }}>Run</span>
            </button>
          </>
        )}

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            style={{
              height: '40px',
              width: '40px',
              padding: 0,
              borderRadius: '12px',
              background: showToolsMenu ? 'var(--color-sidebar)' : 'transparent',
            }}
          >
            <MoreVerticalIcon size={20} />
          </button>

          {showToolsMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: '#15181E',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '18px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                zIndex: 1000,
                minWidth: '220px',
                padding: '6px',
                animation: 'fadeInDown 0.2s ease-out',
              }}
            >
              {toolsMenuItems.map((item, idx) =>
                item.id === 'divider' ? (
                  <div
                    key={idx}
                    style={{ height: '1px', background: '#222', margin: '6px 12px' }}
                  />
                ) : (
                  <button
                    key={item.id}
                    onClick={() => handleEmulatorAction(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      background: 'transparent',
                      color: item.color,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderRadius: '12px',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: `${item.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {toolLoading === item.id ? (
                        <RefreshCwIcon size={14} className="animate-spin" />
                      ) : (
                        item.icon
                      )}
                    </div>
                    {item.label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
