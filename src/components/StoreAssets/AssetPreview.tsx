import React, { useRef } from 'react';
import { UploadIcon, TrashIcon, PlusIcon } from '../Icons';
import { AssetItem } from '../../hooks/useStoreAssets';
import { DevicePreset, BackgroundType } from '../../constants/storeAssets';

interface AssetPreviewProps {
  assets: AssetItem[];
  selectedDevice: DevicePreset;
  gradientStyle: string;
  textColor: string;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: 'title' | 'subtitle', value: string) => void;
  onFileUpload: (files: FileList | null) => void;
  backgroundType: BackgroundType;
  customBackgroundUrl: string | null;
}

export const AssetPreview: React.FC<AssetPreviewProps> = ({
  assets,
  selectedDevice,
  gradientStyle,
  textColor,
  onRemove,
  onUpdate,
  onFileUpload,
  backgroundType,
  customBackgroundUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (assets.length === 0) {
    return (
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
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => onFileUpload(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '3rem',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '3rem',
        height: 'calc(100vh - 280px)',
        minHeight: '400px',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      {assets.map((asset) => (
        <div
          key={asset.id}
          style={{
            flex: '0 0 auto',
            height: '100%',
            aspectRatio: `${selectedDevice.width} / ${selectedDevice.height}`,
            position: 'relative',
            boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
            borderRadius: '2rem',
            // Define a scale factor based on container height to make fonts responsive
            fontSize: 'min(2vw, 16px)',
          }}
        >
          <button
            onClick={() => onRemove(asset.id)}
            style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-danger)',
              color: '#fff',
              border: '3px solid var(--color-bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 30,
              boxShadow: '0 8px 16px rgba(255, 59, 48, 0.3)',
            }}
          >
            <TrashIcon size={18} />
          </button>

          <div
            style={{
              width: '100%',
              height: '100%',
              background:
                backgroundType === 'custom' && customBackgroundUrl
                  ? `url(${customBackgroundUrl})`
                  : gradientStyle,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              borderRadius: 'inherit',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Text Overlay - Positioned exactly as in canvasUtils (top: 8%) */}
            <div
              style={{
                position: 'absolute',
                top: '8%',
                left: 0,
                right: 0,
                textAlign: 'center',
                padding: '0 8%',
                zIndex: 5,
              }}
            >
              <input
                type="text"
                value={asset.title}
                onChange={(e) => onUpdate(asset.id, 'title', e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'center',
                  color: textColor,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  display: 'block',
                  outline: 'none',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textShadow: textColor === '#ffffff' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                }}
                placeholder="Enter title..."
              />
              <input
                type="text"
                value={asset.subtitle}
                onChange={(e) => onUpdate(asset.id, 'subtitle', e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'center',
                  color: textColor,
                  fontSize: '0.8rem',
                  opacity: 0.85,
                  display: 'block',
                  outline: 'none',
                  marginTop: '0.2rem',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                }}
                placeholder="Enter subtitle..."
              />
            </div>

            {/* Device Frame - Using DEVICE_PRESETS ratio */}
            <div
              style={{
                position: 'absolute',
                bottom: selectedDevice.isTablet ? '6%' : '5%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: selectedDevice.isTablet ? '72%' : '70%',
                aspectRatio: `${selectedDevice.width} / ${selectedDevice.height}`,
                backgroundColor: selectedDevice.platform === 'ios' ? '#1c1c1e' : '#202124',
                borderRadius: selectedDevice.isTablet ? '5.5%' : '2.5rem',
                padding: '1%',
                boxSizing: 'border-box',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Screen Area - Exactly matching device ratio */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: selectedDevice.isTablet ? '4.5%' : '2rem',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#333',
                }}
              >
                <img
                  src={asset.imageSrc}
                  alt="Screenshot"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Dynamic Island (iOS Phone only) */}
                {selectedDevice.platform === 'ios' && !selectedDevice.isTablet && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '1.5%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '28%',
                      aspectRatio: '1 / 0.3',
                      backgroundColor: '#000',
                      borderRadius: '50px',
                    }}
                  />
                )}

                {/* Camera hole (Android Phone only) */}
                {selectedDevice.platform === 'android' && !selectedDevice.isTablet && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '1.5%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '3.5%',
                      aspectRatio: '1',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '50%',
                    }}
                  />
                )}

                {/* Home Indicator (iOS only) */}
                {selectedDevice.platform === 'ios' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: selectedDevice.isTablet ? '12%' : '35%',
                      height: selectedDevice.isTablet ? '6px' : '5px',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: '50px',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
