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
    buildCommand?: string;
    config?: {
      firebaseAppId?: string; // Firebase App ID for App Distribution (e.g., 1:1234567890:android:0a1b2c3d4e5f67890)
      distributionGroups?: string; // Comma-separated tester groups (e.g., "qa-team, trusted-testers")
    };
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
  format?: string;
  artifactPath?: string;
}
