import React, { useRef } from 'react';
import { AppleIcon, AndroidIcon, UploadIcon, TrashIcon } from '../Icons';
import {
  DEVICE_PRESETS,
  GRADIENT_PRESETS,
  DevicePreset,
  BackgroundType,
} from '../../constants/storeAssets';

interface AssetSidebarProps {
  selectedDevice: DevicePreset;
  setSelectedDevice: (device: DevicePreset) => void;
  selectedGradient: number;
  setSelectedGradient: (index: number) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  backgroundType: BackgroundType;
  setBackgroundType: (type: BackgroundType) => void;
  customBackgroundUrl: string | null;
  onBackgroundUpload: (files: FileList | null) => void;
  onClearBackground: () => void;
}

export const AssetSidebar: React.FC<AssetSidebarProps> = ({
  selectedDevice,
  setSelectedDevice,
  selectedGradient,
  setSelectedGradient,
  textColor,
  setTextColor,
  backgroundType,
  setBackgroundType,
  customBackgroundUrl,
  onBackgroundUpload,
  onClearBackground,
}) => {
  const iosDevices = DEVICE_PRESETS.filter((d) => d.platform === 'ios');
  const androidDevices = DEVICE_PRESETS.filter((d) => d.platform === 'android');
  const bgInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside
      style={{
        width: '300px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto',
        paddingRight: '4px',
        animation: 'fadeInLeft 0.5s ease-out',
      }}
    >
      {/* Device Configuration */}
      <div
        className="card"
        style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--color-border)' }}
      >
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px',
          }}
        >
          Device Profile
        </h3>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`btn ${selectedDevice.platform === 'ios' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', fontSize: '12px', gap: '6px', borderRadius: '10px' }}
            onClick={() => setSelectedDevice(iosDevices[0])}
          >
            <AppleIcon size={14} />
            iOS
          </button>
          <button
            className={`btn ${selectedDevice.platform === 'android' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', fontSize: '12px', gap: '6px', borderRadius: '10px' }}
            onClick={() => setSelectedDevice(androidDevices[0])}
          >
            <AndroidIcon size={14} />
            Android
          </button>
        </div>

        <select
          value={selectedDevice.id}
          onChange={(e) => {
            const device = DEVICE_PRESETS.find((d) => d.id === e.target.value);
            if (device) setSelectedDevice(device);
          }}
          className="input"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '13px',
            borderRadius: '10px',
            background: 'var(--color-sidebar)',
            cursor: 'pointer',
          }}
        >
          {(selectedDevice.platform === 'ios' ? iosDevices : androidDevices).map((device) => (
            <option key={device.id} value={device.id}>
              {device.name} {device.required ? '★' : ''}
            </option>
          ))}
        </select>

        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            fontSize: '11px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
            }}
          >
            <span>Dimensions:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
              {selectedDevice.width} × {selectedDevice.height}
            </span>
          </div>
          {selectedDevice.required && (
            <div style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
              ★ Mandatory submission size
            </div>
          )}
        </div>
      </div>

      {/* Canvas Controls */}
      <div
        className="card"
        style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--color-border)' }}
      >
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px',
          }}
        >
          Canvas Style
        </h3>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            className={`btn ${backgroundType === 'gradient' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '10px' }}
            onClick={() => setBackgroundType('gradient')}
          >
            Gradient
          </button>
          <button
            className={`btn ${backgroundType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '10px' }}
            onClick={() => bgInputRef.current?.click()}
          >
            <UploadIcon size={12} />
            Custom
          </button>
        </div>

        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => onBackgroundUpload(e.target.files)}
        />

        {backgroundType === 'custom' && customBackgroundUrl ? (
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid var(--color-primary)',
              }}
            >
              <img
                src={customBackgroundUrl}
                alt="Bg"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={onClearBackground}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '8px',
                  background: 'var(--color-error)',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <TrashIcon size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {GRADIENT_PRESETS.map((preset, index) => (
              <button
                key={preset.name}
                title={preset.name}
                onClick={() => {
                  setSelectedGradient(index);
                  setBackgroundType('gradient');
                }}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${preset.colors.join(', ')})`,
                  border:
                    backgroundType === 'gradient' && selectedGradient === index
                      ? '2px solid white'
                      : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform:
                    backgroundType === 'gradient' && selectedGradient === index
                      ? 'scale(1.1)'
                      : 'scale(1)',
                  boxShadow:
                    backgroundType === 'gradient' && selectedGradient === index
                      ? '0 4px 12px rgba(0,0,0,0.3)'
                      : 'none',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Typography Controls */}
      <div
        className="card"
        style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--color-border)' }}
      >
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px',
          }}
        >
          Typography Color
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['#ffffff', '#000000', '#1d1d1f', '#f5f5f7'].map((color) => (
            <button
              key={color}
              onClick={() => setTextColor(color)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: color,
                border:
                  textColor === color
                    ? '2px solid var(--color-primary)'
                    : `1px solid rgba(255,255,255,0.1)`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            />
          ))}
          <div style={{ position: 'relative' }}>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{
                width: '32px',
                height: '32px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                padding: 0,
                background: 'transparent',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </aside>
  );
};
