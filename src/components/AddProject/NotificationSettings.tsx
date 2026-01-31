import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  SlackIcon,
  DiscordIcon,
  TelegramIcon,
  CheckIcon,
  AlertCircleIcon,
  LoaderIcon,
  PlayIcon,
} from '../Icons';

interface NotificationSettingsProps {
  slackWebhook: string;
  setSlackWebhook: (url: string) => void;
  slackEnabled: boolean;
  setSlackEnabled: (enabled: boolean) => void;
  discordWebhook: string;
  setDiscordWebhook: (url: string) => void;
  discordEnabled: boolean;
  setDiscordEnabled: (enabled: boolean) => void;
  telegramBotToken: string;
  setTelegramBotToken: (token: string) => void;
  telegramChatId: string;
  setTelegramChatId: (id: string) => void;
  telegramEnabled: boolean;
  setTelegramEnabled: (enabled: boolean) => void;
  // We need project name if we want to pass a full project object to test_notification,
  // but let's simplify and just pass what's needed or mock it.
  projectName?: string;
  projectPath?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  slackWebhook,
  setSlackWebhook,
  slackEnabled,
  setSlackEnabled,
  discordWebhook,
  setDiscordWebhook,
  discordEnabled,
  setDiscordEnabled,
  telegramBotToken,
  setTelegramBotToken,
  telegramChatId,
  setTelegramChatId,
  telegramEnabled,
  setTelegramEnabled,
  projectName = 'Default Project',
}) => {
  const [activeTab, setActiveTab] = useState<'slack' | 'discord' | 'telegram'>('slack');
  const [testStatus, setTestStatus] = useState<
    Record<string, 'idle' | 'loading' | 'success' | 'error'>
  >({
    slack: 'idle',
    discord: 'idle',
    telegram: 'idle',
  });
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestConnection = async (provider: 'slack' | 'discord' | 'telegram') => {
    setTestStatus((prev) => ({ ...prev, [provider]: 'loading' }));
    setTestError(null);

    try {
      // Construct a mock project object to satisfy the backend command
      const mockProject = {
        id: 'test-id',
        name: projectName,
        path: '',
        ios: { bundleId: '', version: '', buildNumber: 0 },
        android: { bundleId: '', version: '', versionCode: 0 },
        credentials: { iosId: '', androidId: '' },
        notifications: {
          slack: { webhookUrl: slackWebhook, enabled: true },
          discord: { webhookUrl: discordWebhook, enabled: true },
          telegram: { botToken: telegramBotToken, chatId: telegramChatId, enabled: true },
        },
      };

      await invoke('test_notification', { project: mockProject, provider });
      setTestStatus((prev) => ({ ...prev, [provider]: 'success' }));
      setTimeout(() => setTestStatus((prev) => ({ ...prev, [provider]: 'idle' })), 3000);
    } catch (error) {
      console.error('Test notification failed:', error);
      setTestStatus((prev) => ({ ...prev, [provider]: 'error' }));
      setTestError(error as string);
    }
  };

  const providers = [
    {
      id: 'slack',
      name: 'Slack',
      icon: SlackIcon,
      color: '#4A154B',
      gradient: 'linear-gradient(135deg, #4A154B 0%, #611f69 100%)',
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: DiscordIcon,
      color: '#5865F2',
      gradient: 'linear-gradient(135deg, #5865F2 0%, #7289da 100%)',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: TelegramIcon,
      color: '#0088cc',
      gradient: 'linear-gradient(135deg, #0088cc 0%, #229ED9 100%)',
    },
  ] as const;

  return (
    <div className="section animate-fadeIn" style={{ marginBottom: 'var(--spacing-xl)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div
          className="icon-container-primary"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <PlayIcon size={16} style={{ color: 'white', transform: 'rotate(-90deg)' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
            Notification Channels
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Get notified on successful store uploads
          </p>
        </div>
      </div>

      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)',
          transition: 'all var(--transition-normal)',
        }}
      >
        {/* Modern Tab Bar */}
        <div
          style={{
            display: 'flex',
            padding: '4px',
            gap: '4px',
            background: 'var(--color-bg)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveTab(p.id)}
              style={{
                flex: 1,
                padding: '10px var(--spacing-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: activeTab === p.id ? 'white' : 'var(--color-text-secondary)',
                background: activeTab === p.id ? p.gradient : 'transparent',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: activeTab === p.id ? `0 4px 12px ${p.color}40` : 'none',
              }}
            >
              <p.icon size={16} style={{ color: activeTab === p.id ? 'white' : 'inherit' }} />
              {p.name}
            </button>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div style={{ padding: 'var(--spacing-lg)', position: 'relative', minHeight: '180px' }}>
          {providers.map((p) => (
            <div
              key={p.id}
              style={{
                display: activeTab === p.id ? 'block' : 'none',
                animation: 'scaleIn 0.3s ease-out',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: `${p.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: p.color,
                    }}
                  >
                    <p.icon size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{p.name} Integration</h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {p.id === 'telegram' ? 'Instant messaging' : 'Workspace webhook'}
                    </span>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={
                      p.id === 'slack'
                        ? slackEnabled
                        : p.id === 'discord'
                          ? discordEnabled
                          : telegramEnabled
                    }
                    onChange={(e) => {
                      if (p.id === 'slack') setSlackEnabled(e.target.checked);
                      else if (p.id === 'discord') setDiscordEnabled(e.target.checked);
                      else setTelegramEnabled(e.target.checked);
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div
                style={{
                  opacity: (
                    p.id === 'slack'
                      ? slackEnabled
                      : p.id === 'discord'
                        ? discordEnabled
                        : telegramEnabled
                  )
                    ? 1
                    : 0.5,
                  pointerEvents: (
                    p.id === 'slack'
                      ? slackEnabled
                      : p.id === 'discord'
                        ? discordEnabled
                        : telegramEnabled
                  )
                    ? 'auto'
                    : 'none',
                  transition: 'all var(--transition-normal)',
                }}
              >
                {p.id === 'telegram' ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--spacing-md)',
                    }}
                  >
                    <div className="form-group">
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--color-text-secondary)',
                          marginBottom: '6px',
                        }}
                      >
                        Bot Token
                      </label>
                      <input
                        type="password"
                        className="input"
                        placeholder="123456...ABC"
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--color-text-secondary)',
                          marginBottom: '6px',
                        }}
                      >
                        Chat ID
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="-100..."
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        marginBottom: '6px',
                      }}
                    >
                      Webhook URL
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder={`https://${p.id}.com/...`}
                      value={p.id === 'slack' ? slackWebhook : discordWebhook}
                      onChange={(e) =>
                        p.id === 'slack'
                          ? setSlackWebhook(e.target.value)
                          : setDiscordWebhook(e.target.value)
                      }
                    />
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'var(--spacing-lg)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)',
                      maxWidth: '70%',
                      lineHeight: 1.4,
                    }}
                  >
                    {p.id === 'slack' &&
                      "Create an 'Incoming Webhook' in your Slack App settings to get started."}
                    {p.id === 'discord' &&
                      'Go to Channel Settings > Integrations > Webhooks to create a new webhook.'}
                    {p.id === 'telegram' &&
                      'Message @BotFather to create a bot and get a token. Use your own Chat ID or group ID.'}
                  </p>

                  <button
                    type="button"
                    className={`btn ${testStatus[p.id] === 'success' ? 'btn-success' : testStatus[p.id] === 'error' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ padding: '8px 16px', fontSize: '12px', minWidth: '120px' }}
                    disabled={
                      testStatus[p.id] === 'loading' ||
                      !(p.id === 'slack'
                        ? slackEnabled
                        : p.id === 'discord'
                          ? discordEnabled
                          : telegramEnabled)
                    }
                    onClick={() => handleTestConnection(p.id)}
                  >
                    {testStatus[p.id] === 'loading' && (
                      <LoaderIcon size={14} className="animate-spin" />
                    )}
                    {testStatus[p.id] === 'idle' && <span>Test Connection</span>}
                    {testStatus[p.id] === 'success' && (
                      <>
                        <CheckIcon size={14} /> <span>Sent!</span>
                      </>
                    )}
                    {testStatus[p.id] === 'error' && (
                      <>
                        <AlertCircleIcon size={14} /> <span>Failed</span>
                      </>
                    )}
                  </button>
                </div>

                {testStatus[p.id] === 'error' && testError && (
                  <p
                    style={{
                      fontSize: '10px',
                      color: 'var(--color-error)',
                      marginTop: '8px',
                      textAlign: 'right',
                    }}
                  >
                    {testError}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
