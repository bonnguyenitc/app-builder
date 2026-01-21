export interface Project {
  id: string;
  name: string;
  path: string;
  ios: {
    bundleId: string;
    version: string;
    buildNumber: number;
    config?: {
      scheme: string;
      configuration: string;
      teamId?: string;
      exportMethod?: 'development' | 'ad-hoc' | 'app-store' | 'enterprise';
      apiKey?: string;
      apiIssuer?: string;
    };
  };
  android: {
    bundleId: string;
    version: string;
    versionCode: number;
  };
  credentials: {
    appStoreConnectApiKeyId?: string;
    googlePlayServiceAccountPath?: string;
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
