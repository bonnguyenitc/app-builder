import { useState, useCallback } from 'react';
import { UploadIcon } from '../components/Icons';
import { GRADIENT_PRESETS } from '../constants/storeAssets';
import { useStoreAssets } from '../hooks/useStoreAssets';
import { AssetHeader } from '../components/StoreAssets/AssetHeader';
import { AssetSidebar } from '../components/StoreAssets/AssetSidebar';
import { AssetPreview } from '../components/StoreAssets/AssetPreview';

export const StoreAssetsCreator = () => {
  const {
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
    handleBackgroundUpload,
    clearCustomBackground,
  } = useStoreAssets();

  const [isDragging, setIsDragging] = useState(false);
  const gradientColors = GRADIENT_PRESETS[selectedGradient].colors;
  const gradientStyle = `linear-gradient(145deg, ${gradientColors.join(', ')})`;

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

  return (
    <div
      className="page-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        padding: 'var(--spacing-2xl)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '1800px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Premium Drag Overlay */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: '32px',
            backgroundColor: 'rgba(0, 122, 255, 0.05)',
            border: '4px dashed var(--color-primary)',
            borderRadius: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '40px',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 20px 40px rgba(0, 122, 255, 0.3)',
              }}
            >
              <UploadIcon size={64} style={{ color: 'white' }} />
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-primary)' }}>
              Release Artwork
            </h2>
            <p
              style={{ color: 'var(--color-text-secondary)', fontSize: '18px', marginTop: '12px' }}
            >
              Drop your screenshots to import them into the studio.
            </p>
          </div>
        </div>
      )}

      <AssetHeader
        onFileUpload={handleFileUpload}
        onExport={exportAllAssets}
        assetCount={assets.length}
        isExporting={isExporting}
      />

      <div
        style={{
          display: 'flex',
          gap: '32px',
          flex: 1,
          minHeight: 0,
          animation: 'fadeIn 0.6s ease 0.2s both',
        }}
      >
        <AssetSidebar
          selectedDevice={selectedDevice}
          setSelectedDevice={setSelectedDevice}
          selectedGradient={selectedGradient}
          setSelectedGradient={setSelectedGradient}
          textColor={textColor}
          setTextColor={setTextColor}
          backgroundType={backgroundType}
          setBackgroundType={setBackgroundType}
          customBackgroundUrl={customBackgroundUrl}
          onBackgroundUpload={handleBackgroundUpload}
          onClearBackground={clearCustomBackground}
        />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--color-sidebar)',
            borderRadius: '32px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <AssetPreview
            assets={assets}
            selectedDevice={selectedDevice}
            gradientStyle={gradientStyle}
            textColor={textColor}
            onRemove={removeAsset}
            onUpdate={updateAsset}
            onFileUpload={handleFileUpload}
            backgroundType={backgroundType}
            customBackgroundUrl={customBackgroundUrl}
          />
        </main>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
