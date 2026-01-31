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
            alert(`Successfully uninstalled ${selectedPackageName}`);
            break;
          case 'clearData':
            await invoke('adb_clear_app_data', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            alert(`Successfully cleared data for ${selectedPackageName}`);
            break;
          case 'forceStop':
            await invoke('adb_force_stop_app', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            alert(`Successfully stopped ${selectedPackageName}`);
            break;
          case 'restart':
            await invoke('adb_restart_app', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            alert(`Successfully restarted ${selectedPackageName}`);
            break;
          case 'logcat':
            await invoke('adb_open_logcat', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            break;
          case 'screenshot':
            const filePath = await save({
              defaultPath: `screenshot_${Date.now()}.png`,
              filters: [{ name: 'PNG Image', extensions: ['png'] }],
            });
            if (filePath) {
              await invoke('adb_take_screenshot', { deviceId: emulator.id, savePath: filePath });
              alert(`Screenshot saved to ${filePath}`);
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
            alert(`Successfully uninstalled ${selectedPackageName}`);
            break;
          case 'forceStop':
            await invoke('simctl_terminate_app', {
              deviceId: emulator.id,
              bundleId: selectedPackageName,
            });
            alert(`Successfully terminated ${selectedPackageName}`);
            break;
          case 'restart':
            await invoke('simctl_restart_app', {
              deviceId: emulator.id,
              bundleId: selectedPackageName,
            });
            alert(`Successfully restarted ${selectedPackageName}`);
            break;
          case 'screenshot':
            const filePath = await save({
              defaultPath: `screenshot_ios_${Date.now()}.png`,
              filters: [{ name: 'PNG Image', extensions: ['png'] }],
            });
            if (filePath) {
              await invoke('simctl_take_screenshot', { deviceId: emulator.id, savePath: filePath });
              alert(`Screenshot saved to ${filePath}`);
            }
            break;
          case 'erase':
            if (
              confirm(
                'Are you sure you want to Erase all content and settings? This cannot be undone.',
              )
            ) {
              await invoke('simctl_erase_device', { deviceId: emulator.id });
              alert('Device erased successfully');
            }
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
        padding: 'var(--spacing-md)',
        overflow: 'visible',
        zIndex: showToolsMenu ? 50 : 1,
      }}
    >
      <div style={{ overflow: 'hidden', marginRight: '8px' }}>
        <div
          style={{
            fontWeight: 600,
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          title={emulator.name}
        >
          {emulator.name}{' '}
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
            ({emulator.version})
          </span>
          {isRecording && (
            <span
              className="animate-pulse"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-error)',
                display: 'inline-block',
                boxShadow: '0 0 5px var(--color-error)',
              }}
              title="Recording in progress..."
            />
          )}
        </div>
        <div
          style={{
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isBooted ? 'var(--color-success)' : 'var(--color-text-tertiary)',
            }}
          />
          {isLaunching ? 'Booting...' : emulator.state}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {!isBooted && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onLaunch(emulator)}
              disabled={isLaunching}
              style={{ fontSize: '13px', padding: '6px 12px', gap: '6px' }}
            >
              <PlayIcon size={14} />
              {isLaunching ? '...' : 'Boot'}
            </button>
            {!isAndroid && (
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowToolsMenu(!showToolsMenu)}
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                >
                  <MoreVerticalIcon size={16} />
                </button>
                {showToolsMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-xl)',
                      zIndex: 1000,
                      minWidth: '180px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => handleEmulatorAction('erase')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-error)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <EraserIcon size={14} /> Wipe Device
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {isBooted && (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => onDeepLink(emulator)}
              title="Open Deep Link"
              style={{ fontSize: '13px', padding: '6px 12px', gap: '6px' }}
            >
              <LinkIcon size={14} /> Link
            </button>
            <button
              className="btn btn-primary"
              onClick={() => onRun(emulator)}
              disabled={!canRun}
              title={!canRun ? 'Select a project first' : 'Run App'}
              style={{
                fontSize: '13px',
                padding: '6px 12px',
                gap: '6px',
                opacity: canRun ? 1 : 0.5,
              }}
            >
              <SmartphoneIcon size={14} /> Run
            </button>

            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                className={showToolsMenu ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                title="Emulator Tools"
                style={{
                  fontSize: '13px',
                  padding: '6px 10px',
                  transition: 'all 0.2s ease',
                  background: showToolsMenu ? 'var(--color-primary)' : undefined,
                  color: showToolsMenu ? 'white' : undefined,
                }}
              >
                <MoreVerticalIcon size={16} />
              </button>

              {showToolsMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: 'var(--glass-bg-strong)',
                    backdropFilter: 'var(--glass-blur)',
                    WebkitBackdropFilter: 'var(--glass-blur)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 1000,
                    minWidth: '220px',
                    overflow: 'hidden',
                    padding: '4px',
                  }}
                >
                  {toolsMenuItems.map((item) =>
                    item.id === 'divider' ? (
                      <div
                        key={item.id}
                        style={{
                          height: '1px',
                          background: 'var(--color-border)',
                          margin: '4px 8px',
                          opacity: 0.5,
                        }}
                      />
                    ) : (
                      <button
                        key={item.id}
                        onClick={() => handleEmulatorAction(item.id)}
                        disabled={toolLoading !== null}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '10px 12px',
                          border: 'none',
                          background: 'transparent',
                          color: item.color,
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: toolLoading !== null ? 'wait' : 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          borderRadius: 'var(--radius-sm)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-primary-light)';
                        }}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: `${item.color}15`,
                            color: item.color,
                          }}
                        >
                          {toolLoading === item.id ? (
                            <span style={{ fontSize: '10px' }}>⏳</span>
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
          </>
        )}
      </div>
    </div>
  );
};
