export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  platform: 'ios' | 'android';
  isTablet: boolean;
  required: boolean;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'iphone67',
    name: 'iPhone 6.7"',
    width: 1290,
    height: 2796,
    platform: 'ios',
    isTablet: false,
    required: true,
  },
  {
    id: 'iphone65',
    name: 'iPhone 6.5"',
    width: 1284,
    height: 2778,
    platform: 'ios',
    isTablet: false,
    required: true,
  },
  {
    id: 'iphone55',
    name: 'iPhone 5.5"',
    width: 1242,
    height: 2208,
    platform: 'ios',
    isTablet: false,
    required: false,
  },
  {
    id: 'ipadPro129',
    name: 'iPad Pro 12.9"',
    width: 2048,
    height: 2732,
    platform: 'ios',
    isTablet: true,
    required: true,
  },
  {
    id: 'ipadPro11',
    name: 'iPad Pro 11"',
    width: 1668,
    height: 2388,
    platform: 'ios',
    isTablet: true,
    required: false,
  },
  {
    id: 'androidPhone',
    name: 'Android Phone',
    width: 1080,
    height: 2400,
    platform: 'android',
    isTablet: false,
    required: true,
  },
  {
    id: 'androidTablet7',
    name: 'Android 7" Tablet',
    width: 1200,
    height: 1920,
    platform: 'android',
    isTablet: true,
    required: false,
  },
  {
    id: 'androidTablet10',
    name: 'Android 10" Tablet',
    width: 1600,
    height: 2560,
    platform: 'android',
    isTablet: true,
    required: false,
  },
];

export interface GradientPreset {
  name: string;
  colors: string[];
}

export type BackgroundType = 'gradient' | 'custom';

export interface CustomBackground {
  type: BackgroundType;
  gradientIndex: number;
  customImageUrl?: string;
  customImageData?: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'Ocean', colors: ['#667eea', '#764ba2'] },
  { name: 'Sunset', colors: ['#f093fb', '#f5576c'] },
  { name: 'Forest', colors: ['#11998e', '#38ef7d'] },
  { name: 'Night', colors: ['#0f0c29', '#302b63'] },
  { name: 'Peach', colors: ['#ffecd2', '#fcb69f'] },
  { name: 'Sky', colors: ['#a1c4fd', '#c2e9fb'] },
  { name: 'Fire', colors: ['#f12711', '#f5af19'] },
  { name: 'Midnight', colors: ['#232526', '#414345'] },
];
