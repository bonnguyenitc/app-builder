import React from 'react';
import { AppleIcon, AndroidIcon } from '../Icons';
import { DEVICE_PRESETS, GRADIENT_PRESETS, DevicePreset } from '../../constants/storeAssets';
import { sectionTitleStyle } from './StoreAssets.styles';

interface AssetSidebarProps {
  selectedDevice: DevicePreset;
  setSelectedDevice: (device: DevicePreset) => void;
  selectedGradient: number;
  setSelectedGradient: (index: number) => void;
  textColor: string;
  setTextColor: (color: string) => void;
}

export const AssetSidebar: React.FC<AssetSidebarProps> = ({
  selectedDevice,
  setSelectedDevice,
  selectedGradient,
  setSelectedGradient,
  textColor,
  setTextColor,
}) => {
  const iosDevices = DEVICE_PRESETS.filter((d) => d.platform === 'ios');
  const androidDevices = DEVICE_PRESETS.filter((d) => d.platform === 'android');

  return (
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
      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={sectionTitleStyle}>Device Size</h3>
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
          }}
        >
          {(selectedDevice.platform === 'ios' ? iosDevices : androidDevices).map((device) => (
            <option key={device.id} value={device.id}>
              {device.name} ({device.width}×{device.height}){device.required ? ' ⭐' : ''}
            </option>
          ))}
        </select>

        <div
          style={{
            marginTop: '0.75rem',
            padding: '8px 10px',
            background: 'rgba(0,0,0,0.05)',
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
          {selectedDevice.required && (
            <div style={{ marginTop: '4px', color: 'var(--color-warning)' }}>
              ⭐ Required for submission
            </div>
          )}
        </div>
      </div>

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
  );
};
