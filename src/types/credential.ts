export interface IosCredential {
  teamId: string;
  apiKeyId: string;
  apiIssuerId: string;
}

export interface AndroidCredential {
  serviceAccountEmail?: string;
}

export interface Credential {
  id: string;
  name: string;
  platform: 'ios' | 'android';
  ios?: IosCredential;
  android?: AndroidCredential;
  createdAt: number;
  updatedAt: number;
}
