import React, { useRef } from 'react';
import { TrashIcon, PlusIcon, ImageIcon } from '../Icons';
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
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.01)',
          borderRadius: '32px',
          animation: 'fadeIn 0.8s ease',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'var(--color-sidebar)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <ImageIcon size={40} style={{ opacity: 0.2 }} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
          Studio Canvas Empty
        </h3>
        <p
          style={{ color: 'var(--color-text-tertiary)', marginBottom: '32px', textAlign: 'center' }}
        >
          Import screenshots to begin design orchestration.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          style={{ borderRadius: '12px', padding: '0 24px', height: '48px' }}
        >
          <PlusIcon size={18} />
          <span>Import Artwork</span>
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
        gap: '40px',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '40px 60px',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: '#08090A',
      }}
    >
      {assets.map((asset, index) => (
        <div
          key={asset.id}
          style={{
            flex: '0 0 auto',
            height: '100%',
            aspectRatio: `${selectedDevice.width} / ${selectedDevice.height}`,
            position: 'relative',
            borderRadius: '24px',
            animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`,
          }}
        >
          {/* Action Overlay */}
          <button
            onClick={() => onRemove(asset.id)}
            style={{
              position: 'absolute',
              top: '-12px',
              right: '-12px',
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-error)',
              color: '#fff',
              border: '4px solid #08090A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 30,
              boxShadow: '0 8px 16px rgba(255, 59, 48, 0.3)',
            }}
          >
            <TrashIcon size={16} />
          </button>

          <div
            style={{
              width: '100%',
              height: '100%',
              background:
                backgroundType === 'custom' && customBackgroundUrl
                  ? `url(${customBackgroundUrl})`
                  : gradientStyle,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 'inherit',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Typography - Restored to original proportions but with high-end style */}
            <div
              style={{
                position: 'absolute',
                top: '8%',
                left: 0,
                right: 0,
                textAlign: 'center',
                padding: '0 8%',
                zIndex: 10,
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
                  fontSize: '1.4rem', // Restored closer to original (1.2rem)
                  fontWeight: 800,
                  display: 'block',
                  outline: 'none',
                  letterSpacing: '-0.025em',
                  textShadow: textColor === '#ffffff' ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                  lineHeight: 1.2,
                }}
                placeholder="MAIN HEADLINE"
              />
              <textarea
                value={asset.subtitle}
                onChange={(e) => onUpdate(asset.id, 'subtitle', e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'center',
                  color: textColor,
                  fontSize: '0.95rem', // Restored closer to original (0.8rem)
                  fontWeight: 600,
                  opacity: 0.85,
                  display: 'block',
                  outline: 'none',
                  marginTop: '12px',
                  resize: 'none',
                  lineHeight: 1.4,
                  textShadow: textColor === '#ffffff' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}
                placeholder="Secondary description..."
              />
            </div>

            {/* Device Frame - Strictly restoring original 70-72% horizontal ratio for visual balance */}
            <div
              style={{
                position: 'absolute',
                bottom: selectedDevice.isTablet ? '6%' : '5%', // Restored original 5%
                left: '50%',
                transform: 'translateX(-50%)',
                width: selectedDevice.isTablet ? '72%' : '70%', // Restored original 70% width
                aspectRatio: `${selectedDevice.width} / ${selectedDevice.height}`,
                backgroundColor: '#111',
                borderRadius: selectedDevice.isTablet ? '5%' : '2rem',
                padding: '1.5%',
                boxSizing: 'border-box',
                boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: selectedDevice.isTablet ? '4.5%' : '1.75rem',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#000',
                }}
              >
                <img
                  src={asset.imageSrc}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Visual Indicators */}
                {selectedDevice.platform === 'ios' && (
                  <>
                    {!selectedDevice.isTablet && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '1.5%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '28%',
                          height: '3%',
                          background: '#000',
                          borderRadius: '50px',
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '2%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '35%',
                        height: '4px',
                        background: 'rgba(255,255,255,0.4)',
                        borderRadius: '50px',
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
