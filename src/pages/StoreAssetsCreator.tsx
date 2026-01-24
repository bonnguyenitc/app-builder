import React, { useState, useRef, useCallback } from 'react';
import {
  DownloadIcon,
  TrashIcon,
  PlusIcon,
  UploadIcon,
  AppleIcon,
  AndroidIcon,
} from '../components/Icons';
import JSZip from 'jszip';

interface AssetItem {
  id: string;
  imageSrc: string;
  imageData: string;
  title: string;
  subtitle: string;
}

interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  platform: 'ios' | 'android';
  isTablet: boolean;
  required: boolean;
}

const DEVICE_PRESETS: DevicePreset[] = [
  // iOS - Required for App Store
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
  // Android - Required for Play Store
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

const GRADIENT_PRESETS = [
  { name: 'Ocean', colors: ['#667eea', '#764ba2'] },
  { name: 'Sunset', colors: ['#f093fb', '#f5576c'] },
  { name: 'Forest', colors: ['#11998e', '#38ef7d'] },
  { name: 'Night', colors: ['#0f0c29', '#302b63'] },
  { name: 'Peach', colors: ['#ffecd2', '#fcb69f'] },
  { name: 'Sky', colors: ['#a1c4fd', '#c2e9fb'] },
  { name: 'Fire', colors: ['#f12711', '#f5af19'] },
  { name: 'Midnight', colors: ['#232526', '#414345'] },
];

// Helper functions
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const createCanvasGradient = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
): CanvasGradient => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color);
  });
  return gradient;
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

interface ExportOptions {
  device: DevicePreset;
  title: string;
  subtitle: string;
  imageData: string;
  gradientColors: string[];
  textColor: string;
}

const generateAssetImage = async (options: ExportOptions): Promise<Blob> => {
  const { device, title, subtitle, imageData, gradientColors, textColor } = options;
  const { width, height, platform, isTablet } = device;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Draw gradient background
  const gradient = createCanvasGradient(ctx, width, height, gradientColors);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Text settings
  const titleFontSize = Math.round(width * 0.055);
  const subtitleFontSize = Math.round(width * 0.032);
  const titleY = Math.round(height * 0.08);
  const subtitleY = titleY + titleFontSize + 10;

  // Draw title
  ctx.fillStyle = textColor;
  ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (textColor === '#ffffff' || textColor === '#fff') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
  }

  ctx.fillText(title, width / 2, titleY);

  // Draw subtitle
  ctx.font = `${subtitleFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(subtitle, width / 2, subtitleY);
  ctx.globalAlpha = 1;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Device frame dimensions
  const frameWidth = Math.round(width * (isTablet ? 0.75 : 0.65));
  const frameHeight = Math.round(height * 0.72);
  const frameX = (width - frameWidth) / 2;
  const frameY = height - frameHeight - Math.round(height * 0.04);

  const isIOS = platform === 'ios';
  const frameRadius = isTablet
    ? Math.round(frameWidth * 0.03)
    : isIOS
      ? Math.round(frameWidth * 0.12)
      : Math.round(frameWidth * 0.08);
  const framePadding = Math.round(frameWidth * 0.02);
  const screenRadius = frameRadius - framePadding;

  // Draw frame shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  // Draw frame
  ctx.fillStyle = isIOS ? '#1c1c1e' : '#202124';
  roundRect(ctx, frameX, frameY, frameWidth, frameHeight, frameRadius);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Screen area
  const screenX = frameX + framePadding;
  const screenY = frameY + framePadding;
  const screenWidth = frameWidth - framePadding * 2;
  const screenHeight = frameHeight - framePadding * 2;

  // Clip to screen
  ctx.save();
  roundRect(ctx, screenX, screenY, screenWidth, screenHeight, screenRadius);
  ctx.clip();

  // Draw screenshot
  try {
    const img = await loadImage(imageData);
    const imgRatio = img.width / img.height;
    const screenRatio = screenWidth / screenHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (imgRatio > screenRatio) {
      drawHeight = screenHeight;
      drawWidth = drawHeight * imgRatio;
      drawX = screenX - (drawWidth - screenWidth) / 2;
      drawY = screenY;
    } else {
      drawWidth = screenWidth;
      drawHeight = drawWidth / imgRatio;
      drawX = screenX;
      drawY = screenY - (drawHeight - screenHeight) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  } catch (e) {
    ctx.fillStyle = '#333';
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
  }

  ctx.restore();

  // Draw Dynamic Island (iOS phones only)
  if (isIOS && !isTablet) {
    const diWidth = Math.round(screenWidth * 0.28);
    const diHeight = Math.round(diWidth * 0.3);
    const diX = screenX + (screenWidth - diWidth) / 2;
    const diY = screenY + Math.round(screenHeight * 0.015);

    ctx.fillStyle = '#000';
    roundRect(ctx, diX, diY, diWidth, diHeight, diHeight / 2);
    ctx.fill();
  }

  // Draw camera (Android only)
  if (!isIOS && !isTablet) {
    const cameraSize = Math.round(screenWidth * 0.035);
    const cameraX = screenX + screenWidth / 2 - cameraSize / 2;
    const cameraY = screenY + Math.round(screenHeight * 0.015);

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cameraX + cameraSize / 2, cameraY + cameraSize / 2, cameraSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw home indicator (iOS only)
  if (isIOS) {
    const indicatorWidth = Math.round(screenWidth * (isTablet ? 0.12 : 0.35));
    const indicatorHeight = isTablet ? 6 : 5;
    const indicatorX = screenX + (screenWidth - indicatorWidth) / 2;
    const indicatorY = screenY + screenHeight - Math.round(screenHeight * 0.02);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    roundRect(ctx, indicatorX, indicatorY, indicatorWidth, indicatorHeight, indicatorHeight / 2);
    ctx.fill();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      },
      'image/png',
      1.0,
    );
  });
};

export const StoreAssetsCreator: React.FC = () => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [textColor, setTextColor] = useState('#ffffff');
  const [isExporting, setIsExporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gradientColors = GRADIENT_PRESETS[selectedGradient].colors;
  const gradientStyle = `linear-gradient(145deg, ${gradientColors.join(', ')})`;

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];

        const blob = await generateAssetImage({
          device: selectedDevice,
          title: asset.title,
          subtitle: asset.subtitle,
          imageData: asset.imageData,
          gradientColors,
          textColor,
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
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const iosDevices = DEVICE_PRESETS.filter((d) => d.platform === 'ios');
  const androidDevices = DEVICE_PRESETS.filter((d) => d.platform === 'android');

  return (
    <div
      className="page-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 122, 255, 0.15)',
            border: '3px dashed var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <UploadIcon size={48} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Drop screenshots here
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Store Assets Creator</h1>
          <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
            Create stunning App Store & Play Store screenshots
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => fileInputRef.current?.click()}
          >
            <PlusIcon size={16} />
            Add Screenshots
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <button
            className="btn btn-primary btn-lg"
            onClick={exportAllAssets}
            disabled={assets.length === 0 || isExporting}
          >
            {isExporting ? (
              <span>Exporting...</span>
            ) : (
              <>
                <DownloadIcon size={16} />
                Export All ({assets.length})
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0, marginTop: '1rem' }}>
        {/* Sidebar Controls */}
        <aside
          style={{
            width: '280px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            overflowY: 'auto',
          }}
        >
          {/* Device Selection - Compact */}
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={sectionTitleStyle}>Device Size</h3>

            {/* Platform Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
              <button
                className={`btn ${selectedDevice.platform === 'ios' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '6px 12px', fontSize: '12px', gap: '4px' }}
                onClick={() => setSelectedDevice(iosDevices[0])}
              >
                <AppleIcon size={12} />
                iOS
              </button>
              <button
                className={`btn ${selectedDevice.platform === 'android' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '6px 12px', fontSize: '12px', gap: '4px' }}
                onClick={() => setSelectedDevice(androidDevices[0])}
              >
                <AndroidIcon size={12} />
                Android
              </button>
            </div>

            {/* Device Dropdown */}
            <select
              value={selectedDevice.id}
              onChange={(e) => {
                const device = DEVICE_PRESETS.find((d) => d.id === e.target.value);
                if (device) setSelectedDevice(device);
              }}
              className="input"
              style={{
                padding: '10px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              {(selectedDevice.platform === 'ios' ? iosDevices : androidDevices).map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.width}×{device.height}){device.required ? ' ⭐' : ''}
                </option>
              ))}
            </select>

            {/* Quick Info */}
            <div
              style={{
                marginTop: '0.75rem',
                padding: '8px 10px',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Size:</span>
                <strong>
                  {selectedDevice.width}×{selectedDevice.height}px
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                <span>Store:</span>
                <span>{selectedDevice.platform === 'ios' ? 'App Store' : 'Play Store'}</span>
              </div>
              {selectedDevice.required && (
                <div style={{ marginTop: '4px', color: 'var(--color-warning)' }}>
                  ⭐ Required for submission
                </div>
              )}
            </div>
          </div>

          {/* Background Gradient */}
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={sectionTitleStyle}>Background</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {GRADIENT_PRESETS.map((preset, index) => (
                <button
                  key={preset.name}
                  title={preset.name}
                  onClick={() => setSelectedGradient(index)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    background: `linear-gradient(145deg, ${preset.colors.join(', ')})`,
                    border:
                      selectedGradient === index
                        ? '2px solid var(--color-primary)'
                        : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                    transform: selectedGradient === index ? 'scale(1.08)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Text Color */}
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={sectionTitleStyle}>Text Color</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['#ffffff', '#000000', '#1d1d1f', '#f5f5f7'].map((color) => (
                <button
                  key={color}
                  onClick={() => setTextColor(color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: color,
                    border:
                      textColor === color
                        ? '2px solid var(--color-primary)'
                        : `2px solid ${color === '#ffffff' ? '#ddd' : 'transparent'}`,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  }}
                />
              ))}
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: '1rem',
          }}
        >
          {assets.length === 0 ? (
            <div
              className="card"
              style={{
                height: '100%',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed var(--color-border)',
                background: 'var(--color-bg-secondary)',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary), #5856d6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <UploadIcon size={36} style={{ color: '#fff' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                No screenshots yet
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                Drag and drop your app screenshots here
              </p>
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                <PlusIcon size={16} />
                Choose Screenshots
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                overflowX: 'auto',
                overflowY: 'hidden',
                paddingBottom: '1rem',
                minHeight: '500px',
                height: 'calc(100vh - 250px)',
              }}
            >
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    flex: '0 0 auto',
                    width: selectedDevice.isTablet ? '400px' : '320px',
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  <button
                    onClick={() => removeAsset(asset.id)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-danger)',
                      color: '#fff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(255, 59, 48, 0.4)',
                    }}
                  >
                    <TrashIcon size={14} />
                  </button>

                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: gradientStyle,
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '24px 16px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: '16px', width: '100%' }}>
                      <input
                        type="text"
                        value={asset.title}
                        onChange={(e) => updateAsset(asset.id, 'title', e.target.value)}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'center',
                          color: textColor,
                          fontSize: '18px',
                          fontWeight: 700,
                          outline: 'none',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          textShadow:
                            textColor === '#ffffff' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                        }}
                        placeholder="Enter title..."
                      />
                      <input
                        type="text"
                        value={asset.subtitle}
                        onChange={(e) => updateAsset(asset.id, 'subtitle', e.target.value)}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'center',
                          color: textColor,
                          fontSize: '12px',
                          opacity: 0.85,
                          outline: 'none',
                          marginTop: '4px',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          textShadow:
                            textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                        }}
                        placeholder="Enter subtitle..."
                      />
                    </div>

                    <div
                      style={{
                        flex: 1,
                        width: '100%',
                        minHeight: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: selectedDevice.isTablet ? '90%' : '75%',
                          aspectRatio: `${selectedDevice.width} / ${selectedDevice.height}`,
                          maxHeight: '100%',
                          position: 'relative',
                          backgroundColor:
                            selectedDevice.platform === 'ios' ? '#1c1c1e' : '#202124',
                          borderRadius: selectedDevice.isTablet ? '16px' : '28px',
                          padding: '6px',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                          boxSizing: 'border-box',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: selectedDevice.isTablet ? '10px' : '22px',
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#000',
                          }}
                        >
                          <img
                            src={asset.imageSrc}
                            alt="Screenshot"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              objectPosition: 'center',
                            }}
                          />
                          {/* Dynamic Island (iOS phones) */}
                          {selectedDevice.platform === 'ios' && !selectedDevice.isTablet && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '6px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '28%',
                                height: '20px',
                                backgroundColor: '#000',
                                borderRadius: '10px',
                              }}
                            />
                          )}
                          {/* Camera (Android phones) */}
                          {selectedDevice.platform === 'android' && !selectedDevice.isTablet && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '6px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#1a1a1a',
                                borderRadius: '50%',
                              }}
                            />
                          )}
                          {/* Home Indicator (iOS) */}
                          {selectedDevice.platform === 'ios' && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: selectedDevice.isTablet ? '12%' : '35%',
                                height: '4px',
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                borderRadius: '2px',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: '0 0 auto',
                  width: '200px',
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.background = 'rgba(0, 122, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.background = 'var(--color-bg-secondary)';
                }}
              >
                <PlusIcon
                  size={40}
                  style={{ color: 'var(--color-text-tertiary)', marginBottom: '0.75rem' }}
                />
                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
                >
                  Add more
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-secondary)',
  marginBottom: '0.75rem',
  display: 'flex',
  alignItems: 'center',
};
