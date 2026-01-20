export interface Project {
  id: string;
  name: string;
  path: string;
  bundleId: {
    ios: string;
    android: string;
  };
  version: {
    ios: string;
    android: string;
  };
  buildNumber: {
    ios: number;
    android: number;
  };
  credentials: {
    appStoreConnectApiKeyId?: string;
    googlePlayServiceAccountPath?: string;
  };
  iosConfig?: {
    scheme: string;
    configuration: string;
    teamId?: string;
    exportMethod?: 'development' | 'ad-hoc' | 'app-store' | 'enterprise';
  };
  lastBuild?: BuildHistory;
}

export interface BuildHistory {
  id: string;
  projectId: string;
  platform: 'ios' | 'android';
  version: string;
  buildNumber: number;
  status: 'success' | 'failed' | 'building';
  timestamp: number;
  logs: string;
  logFilePath?: string; // Path to log file (especially for iOS builds)
}
