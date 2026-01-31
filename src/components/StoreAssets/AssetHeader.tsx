import React, { useRef } from 'react';
import { PlusIcon, DownloadIcon } from '../Icons';

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
    <header className="page-header" style={{ flexShrink: 0 }}>
      <div>
        <h1 className="page-title">Store Assets Creator</h1>
        <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
          Create stunning App Store & Play Store screenshots
        </p>
      </div>
      <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn btn-secondary btn-lg" onClick={() => fileInputRef.current?.click()}>
          <PlusIcon size={16} />
          Add Screenshots
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
          className="btn btn-primary btn-lg"
          onClick={onExport}
          disabled={assetCount === 0 || isExporting}
        >
          {isExporting ? (
            <span>Exporting...</span>
          ) : (
            <>
              <DownloadIcon size={16} />
              Export All ({assetCount})
            </>
          )}
        </button>
      </div>
    </header>
  );
};
