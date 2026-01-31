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
    iosId?: string;
    androidId?: string;
  };
  notifications?: {
    slack?: {
      webhookUrl: string;
      enabled: boolean;
    };
    discord?: {
      webhookUrl: string;
      enabled: boolean;
    };
    telegram?: {
      botToken: string;
      chatId: string;
      enabled: boolean;
    };
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
  releaseNote: string;
}
