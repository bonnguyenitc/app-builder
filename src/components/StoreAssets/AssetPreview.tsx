import React, { useRef } from 'react';
import { UploadIcon, TrashIcon, PlusIcon } from '../Icons';
import { AssetItem } from '../../hooks/useStoreAssets';
import { DevicePreset } from '../../constants/storeAssets';

interface AssetPreviewProps {
  assets: AssetItem[];
  selectedDevice: DevicePreset;
  gradientStyle: string;
  textColor: string;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: 'title' | 'subtitle', value: string) => void;
  onFileUpload: (files: FileList | null) => void;
}

export const AssetPreview: React.FC<AssetPreviewProps> = ({
  assets,
  selectedDevice,
  gradientStyle,
  textColor,
  onRemove,
  onUpdate,
  onFileUpload,
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
            onClick={() => onRemove(asset.id)}
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
                onChange={(e) => onUpdate(asset.id, 'title', e.target.value)}
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
                  fontSize: '13px',
                  opacity: 0.8,
                  outline: 'none',
                  marginTop: '4px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                }}
                placeholder="Enter subtitle..."
              />
            </div>

            <div
              style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                paddingTop: '20px',
              }}
            >
              <img
                src={asset.imageSrc}
                alt="Screenshot"
                style={{
                  width: '85%',
                  height: 'auto',
                  maxHeight: '100%',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  objectFit: 'cover',
                  objectPosition: 'top',
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
