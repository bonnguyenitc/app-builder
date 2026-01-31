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

      <AssetHeader
        onFileUpload={handleFileUpload}
        onExport={exportAllAssets}
        assetCount={assets.length}
        isExporting={isExporting}
      />

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0, marginTop: '1rem' }}>
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

        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', paddingBottom: '1rem' }}>
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
        </div>
      </div>
    </div>
  );
};
