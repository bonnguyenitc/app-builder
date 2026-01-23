export interface Permission {
  key: string;
  name: string;
  enabled: boolean;
  description?: string;
  explanation?: string;
}

export interface PermissionsResult {
  android_path?: string;
  ios_path?: string;
  android: Permission[];
  ios: Permission[];
}
