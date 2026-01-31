import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Project } from '../types/project';
import { useCredentials } from './useCredentials';

interface AppJsonInfo {
  name: string | null;
  ios_bundle_id: string | null;
  android_package: string | null;
  ios_version: string | null;
  android_version: string | null;
  ios_build_number: string | null;
  android_version_code: number | null;
}

export const useProjectForm = (
  initialData?: Project,
  isOpen?: boolean,
  onClose?: () => void,
  onSave?: (project: Omit<Project, 'id'>) => void,
) => {
  const { credentials } = useCredentials();

  // Initialize states directly from initialData
  const [name, setName] = useState(initialData?.name || '');
  const [path, setPath] = useState(initialData?.path || '');
  const [iosBundle, setIosBundle] = useState(initialData?.ios?.bundleId || '');
  const [androidBundle, setAndroidBundle] = useState(initialData?.android?.bundleId || '');
  const [iosVersion, setIosVersion] = useState(initialData?.ios?.version || '1.0.0');
  const [androidVersion, setAndroidVersion] = useState(initialData?.android?.version || '1.0.0');
  const [iosBuildNumber, setIosBuildNumber] = useState(initialData?.ios?.buildNumber || 1);
  const [androidBuildNumber, setAndroidBuildNumber] = useState(
    initialData?.android?.versionCode || 1,
  );
  const [iosScheme, setIosScheme] = useState(initialData?.ios?.config?.scheme || '');
  const [iosConfiguration, setIosConfiguration] = useState(
    initialData?.ios?.config?.configuration || 'Release',
  );
  const [iosExportMethod, setIosExportMethod] = useState<
    'development' | 'ad-hoc' | 'app-store' | 'enterprise'
  >(initialData?.ios?.config?.exportMethod || 'development');

  const [selectedIosId, setSelectedIosId] = useState(initialData?.credentials?.iosId || '');
  const [selectedAndroidId, setSelectedAndroidId] = useState(
    initialData?.credentials?.androidId || '',
  );

  // Notifications
  const [slackWebhook, setSlackWebhook] = useState(
    initialData?.notifications?.slack?.webhookUrl || '',
  );
  const [slackEnabled, setSlackEnabled] = useState(
    initialData?.notifications?.slack?.enabled || false,
  );

  const [discordWebhook, setDiscordWebhook] = useState(
    initialData?.notifications?.discord?.webhookUrl || '',
  );
  const [discordEnabled, setDiscordEnabled] = useState(
    initialData?.notifications?.discord?.enabled || false,
  );

  const [telegramBotToken, setTelegramBotToken] = useState(
    initialData?.notifications?.telegram?.botToken || '',
  );
  const [telegramChatId, setTelegramChatId] = useState(
    initialData?.notifications?.telegram?.chatId || '',
  );
  const [telegramEnabled, setTelegramEnabled] = useState(
    initialData?.notifications?.telegram?.enabled || false,
  );

  const iosCredentials = credentials.filter((c) => c.platform === 'ios');
  const androidCredentials = credentials.filter((c) => c.platform === 'android');

  // Sync states when initialData or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setPath(initialData?.path || '');
      setIosBundle(initialData?.ios?.bundleId || '');
      setAndroidBundle(initialData?.android?.bundleId || '');
      setIosVersion(initialData?.ios?.version || '1.0.0');
      setAndroidVersion(initialData?.android?.version || '1.0.0');
      setIosBuildNumber(initialData?.ios?.buildNumber || 1);
      setAndroidBuildNumber(initialData?.android?.versionCode || 1);
      setIosScheme(initialData?.ios?.config?.scheme || '');
      setIosConfiguration(initialData?.ios?.config?.configuration || 'Release');
      setIosExportMethod(initialData?.ios?.config?.exportMethod || 'development');
      setSelectedIosId(initialData?.credentials?.iosId || '');
      setSelectedAndroidId(initialData?.credentials?.androidId || '');

      setSlackWebhook(initialData?.notifications?.slack?.webhookUrl || '');
      setSlackEnabled(initialData?.notifications?.slack?.enabled || false);
      setDiscordWebhook(initialData?.notifications?.discord?.webhookUrl || '');
      setDiscordEnabled(initialData?.notifications?.discord?.enabled || false);
      setTelegramBotToken(initialData?.notifications?.telegram?.botToken || '');
      setTelegramChatId(initialData?.notifications?.telegram?.chatId || '');
      setTelegramEnabled(initialData?.notifications?.telegram?.enabled || false);
    }
  }, [isOpen, initialData]);

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select React Native Project Root',
      });
      if (selected && typeof selected === 'string') {
        setPath(selected);
        try {
          const appInfo = await invoke<AppJsonInfo>('read_native_project_info', {
            projectPath: selected,
          });
          if (appInfo.name) {
            setName(appInfo.name);
            if (!iosScheme) setIosScheme(appInfo.name);
          }
          if (appInfo.ios_bundle_id) setIosBundle(appInfo.ios_bundle_id);
          if (appInfo.android_package) setAndroidBundle(appInfo.android_package);
          if (appInfo.ios_version) setIosVersion(appInfo.ios_version);
          if (appInfo.android_version) setAndroidVersion(appInfo.android_version);
          if (appInfo.ios_build_number) {
            const parsed = parseInt(appInfo.ios_build_number);
            if (!isNaN(parsed)) setIosBuildNumber(parsed);
          }
          if (appInfo.android_version_code) setAndroidBuildNumber(appInfo.android_version_code);
        } catch (error) {
          console.log('Could not read native project info:', error);
          if (!name && selected) {
            const folderName = selected.split('/').pop();
            if (folderName) {
              setName(folderName);
              if (!iosScheme) setIosScheme(folderName);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to open dialog', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const iosCred = iosCredentials.find((c) => c.id === selectedIosId);

    // Create the project object for saving
    const projectData = {
      name,
      path,
      ios: {
        bundleId: iosBundle,
        version: iosVersion,
        buildNumber: iosBuildNumber,
        config: {
          scheme: iosScheme || name,
          configuration: iosConfiguration || 'Release',
          teamId: iosCred?.ios?.teamId || initialData?.ios?.config?.teamId,
          exportMethod: iosExportMethod,
          apiKey: iosCred?.ios?.apiKeyId || initialData?.ios?.config?.apiKey,
          apiIssuer: iosCred?.ios?.apiIssuerId || initialData?.ios?.config?.apiIssuer,
        },
      },
      android: {
        bundleId: androidBundle,
        version: androidVersion,
        versionCode: androidBuildNumber,
      },
      credentials: {
        iosId: selectedIosId || undefined,
        androidId: selectedAndroidId || undefined,
      },
      notifications: {
        slack: {
          webhookUrl: slackWebhook,
          enabled: slackEnabled,
        },
        discord: {
          webhookUrl: discordWebhook,
          enabled: discordEnabled,
        },
        telegram: {
          botToken: telegramBotToken,
          chatId: telegramChatId,
          enabled: telegramEnabled,
        },
      },
    };

    console.log('Submitting Project Data:', projectData);
    onSave?.(projectData);
    onClose?.();
  };

  return {
    states: {
      name,
      setName,
      path,
      setPath,
      iosBundle,
      setIosBundle,
      androidBundle,
      setAndroidBundle,
      iosVersion,
      setIosVersion,
      androidVersion,
      setAndroidVersion,
      iosBuildNumber,
      setIosBuildNumber,
      androidBuildNumber,
      setAndroidBuildNumber,
      iosScheme,
      setIosScheme,
      iosConfiguration,
      setIosConfiguration,
      iosExportMethod,
      setIosExportMethod,
      selectedIosCredentialId: selectedIosId,
      setSelectedIosCredentialId: setSelectedIosId,
      selectedAndroidCredentialId: selectedAndroidId,
      setSelectedAndroidCredentialId: setSelectedAndroidId,
      iosCredentials,
      androidCredentials,
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
    },
    handlers: {
      handleBrowse,
      handleSubmit,
    },
  };
};
