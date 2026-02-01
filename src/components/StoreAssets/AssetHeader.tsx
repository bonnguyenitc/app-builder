import React, { useRef } from 'react';
import { PlusIcon, SparklesIcon } from '../Icons';

interface AssetHeaderProps {
  onFileUpload: (files: FileList | null) => void;
  onExport: () => void;
  assetCount: number;
  isExporting: boolean;
}

export const AssetHeader: React.FC<AssetHeaderProps> = ({
  onFileUpload,
  onExport,
  assetCount,
  isExporting,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexShrink: 0,
        animation: 'fadeInDown 0.5s ease-out',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              backgroundColor: 'rgba(0, 122, 255, 0.1)',
              color: 'var(--color-primary)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Studio tools
          </span>
        </div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-text)',
            letterSpacing: '-0.02em',
          }}
        >
          Asset Studio
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Design and export high-impact store screenshots with precision.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          style={{
            height: '44px',
            padding: '0 20px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <PlusIcon size={16} />
          <span>Add Source</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => onFileUpload(e.target.files)}
        />
        <button
          className="btn btn-primary"
          onClick={onExport}
          disabled={assetCount === 0 || isExporting}
          style={{
            height: '44px',
            padding: '0 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            boxShadow: assetCount > 0 ? '0 8px 16px rgba(0, 122, 255, 0.2)' : 'none',
          }}
        >
          {isExporting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                className="animate-spin"
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                }}
              />
              <span>Exporting</span>
            </div>
          ) : (
            <>
              <SparklesIcon size={16} />
              <span>Export {assetCount} Assets</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
