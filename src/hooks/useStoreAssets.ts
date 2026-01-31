import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import {
  DEVICE_PRESETS,
  GRADIENT_PRESETS,
  DevicePreset,
  BackgroundType,
} from '../constants/storeAssets';
import { generateAssetImage } from '../utils/canvasUtils';

export interface AssetItem {
  id: string;
  imageSrc: string;
  imageData: string;
  title: string;
  subtitle: string;
}

export const useStoreAssets = () => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [textColor, setTextColor] = useState('#ffffff');
  const [isExporting, setIsExporting] = useState(false);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('gradient');
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | null>(null);
  const [customBackgroundData, setCustomBackgroundData] = useState<string | null>(null);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newAssets: AssetItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const imageData = await fileToDataUrl(file);
      newAssets.push({
        id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        imageSrc: URL.createObjectURL(file),
        imageData,
        title: 'Your Amazing Feature',
        subtitle: 'A brief description of what this screen does',
      });
    }
    setAssets((prev) => [...prev, ...newAssets]);
  }, []);

  const handleBackgroundUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const imageData = await fileToDataUrl(file);
    const imageUrl = URL.createObjectURL(file);

    setCustomBackgroundData(imageData);
    setCustomBackgroundUrl(imageUrl);
    setBackgroundType('custom');
  }, []);

  const clearCustomBackground = useCallback(() => {
    if (customBackgroundUrl) {
      URL.revokeObjectURL(customBackgroundUrl);
    }
    setCustomBackgroundData(null);
    setCustomBackgroundUrl(null);
    setBackgroundType('gradient');
  }, [customBackgroundUrl]);

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateAsset = useCallback((id: string, field: 'title' | 'subtitle', value: string) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }, []);

  const exportAllAssets = async () => {
    if (assets.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('store_assets');
      const gradientColors = GRADIENT_PRESETS[selectedGradient].colors;

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const blob = await generateAssetImage({
          device: selectedDevice,
          title: asset.title,
          subtitle: asset.subtitle,
          imageData: asset.imageData,
          gradientColors,
          textColor,
          backgroundType,
          customBackgroundData: customBackgroundData || undefined,
        });

        const fileName = `screenshot_${String(i + 1).padStart(2, '0')}_${selectedDevice.id}_${asset.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}.png`;
        folder?.file(fileName, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `store_assets_${selectedDevice.id}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Export successful!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    assets,
    selectedDevice,
    setSelectedDevice,
    selectedGradient,
    setSelectedGradient,
    textColor,
    setTextColor,
    isExporting,
    handleFileUpload,
    removeAsset,
    updateAsset,
    exportAllAssets,
    backgroundType,
    setBackgroundType,
    customBackgroundUrl,
    customBackgroundData,
    handleBackgroundUpload,
    clearCustomBackground,
  };
};
