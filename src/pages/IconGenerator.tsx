import React, { useState } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import {
  ImageIcon,
  CheckCircleIcon,
  XCircleIcon,
  FolderIcon,
  AppleIcon,
  AndroidIcon,
  SparklesIcon,
} from '../components/Icons';
import { IconGenerationOptions, IconGenerationResult } from '../types/icon';

export const IconGenerator: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<('ios' | 'android')[]>(['ios', 'android']);
  const [androidIconName, setAndroidIconName] = useState('ic_launcher');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<IconGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Image',
            extensions: ['png', 'jpg', 'jpeg'],
          },
        ],
      });

      if (selected && typeof selected === 'string') {
        setSelectedImage(selected);
        // Convert file path to asset URL for Tauri
        const assetUrl = convertFileSrc(selected);
        setImagePreview(assetUrl);
        setError(null);
        setResult(null);
      }
    } catch (err) {
      setError('Failed to select image');
      console.error('Image selection error:', err);
    }
  };

  const togglePlatform = (platform: 'ios' | 'android') => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    if (platforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    // Select output directory
    const outputPath = await open({
      directory: true,
      multiple: false,
    });

    if (!outputPath || typeof outputPath !== 'string') {
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const options: IconGenerationOptions = {
        source_image_path: selectedImage,
        output_path: outputPath,
        platforms,
        android_icon_name: androidIconName || 'ic_launcher',
      };

      const generationResult = await invoke<IconGenerationResult>('generate_app_icons', {
        options,
      });

      setResult(generationResult);
      if (!generationResult.success) {
        setError(generationResult.message || 'Failed to generate icons');
      }
    } catch (err) {
      setError(String(err));
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenOutputFolder = async () => {
    if (result?.output_path) {
      try {
        await invoke('open_folder', { path: result.output_path });
      } catch (err) {
        console.error('Failed to open folder:', err);
      }
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '4px',
            color: 'var(--color-primary)',
          }}
        >
          App Icon Generator
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Generate app icons in all required sizes for iOS and Android from a single image
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Left Column - Upload & Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Upload Section */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Source Image</h3>
              {selectedImage && (
                <button
                  className="btn btn-ghost"
                  onClick={handleReset}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  Reset
                </button>
              )}
            </div>

            <div
              onClick={handleImageSelect}
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-2xl)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: 'var(--color-bg-secondary)',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.backgroundColor = 'rgba(0, 122, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              }}
            >
              {imagePreview ? (
                <div>
                  <img
                    src={imagePreview}
                    alt="Selected icon"
                    style={{
                      maxWidth: '180px',
                      maxHeight: '180px',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                    onError={() => {
                      console.error('Image failed to load');
                      setError('Failed to load image preview');
                    }}
                  />
                  <p
                    style={{
                      marginTop: 'var(--spacing-md)',
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Click to change image
                  </p>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, #5856d6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto var(--spacing-md)',
                    }}
                  >
                    <ImageIcon size={32} color="white" />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                    Click to select an image
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    PNG or JPG • Recommended: 1024×1024 or larger
                  </p>
                </div>
              )}
            </div>

            {selectedImage && (
              <div
                style={{
                  marginTop: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}
              >
                {selectedImage}
              </div>
            )}
          </div>

          {/* Platform Selection */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              Target Platforms
            </h3>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <button
                className={`btn ${platforms.includes('ios') ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => togglePlatform('ios')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <AppleIcon size={18} />
                <span>iOS</span>
              </button>
              <button
                className={`btn ${platforms.includes('android') ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => togglePlatform('android')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <AndroidIcon size={18} />
                <span>Android</span>
              </button>
            </div>

            {platforms.length > 0 && (
              <div
                style={{
                  marginTop: 'var(--spacing-md)',
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {platforms.includes('ios') && <div>✓ iOS: AppIcon.appiconset (18 sizes)</div>}
                {platforms.includes('android') && (
                  <div>
                    ✓ Android: 15 icons
                    <div style={{ marginLeft: '16px', fontSize: '11px', opacity: 0.8 }}>
                      • ic_launcher (5 sizes)
                      <br />
                      • ic_launcher_round (5 sizes)
                      <br />• ic_launcher_foreground (5 sizes)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Android Icon Name Input */}
            {platforms.includes('android') && (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    marginBottom: '4px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Android Icon Name
                </label>
                <input
                  type="text"
                  value={androidIconName}
                  onChange={(e) => setAndroidIconName(e.target.value)}
                  placeholder="ic_launcher"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!selectedImage || platforms.length === 0 || isGenerating}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: 'var(--spacing-md)',
              fontSize: '15px',
            }}
          >
            <SparklesIcon size={18} />
            <span>{isGenerating ? 'Generating...' : 'Generate Icons'}</span>
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
            {result?.success ? 'Generation Complete' : 'Output'}
          </h3>

          {error && (
            <div
              style={{
                padding: 'var(--spacing-md)',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-sm)',
              }}
            >
              <XCircleIcon size={20} color="var(--color-error)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--color-error)' }}>{error}</span>
            </div>
          )}

          {result?.success && (
            <div>
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                  border: '1px solid var(--color-success)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <CheckCircleIcon size={20} color="var(--color-success)" />
                <span style={{ fontSize: '13px', color: 'var(--color-success)' }}>
                  {result.message}
                </span>
              </div>

              <div
                style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  <strong>Output:</strong>
                  <div
                    style={{
                      marginTop: '4px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {result.output_path}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                onClick={handleOpenOutputFolder}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <FolderIcon size={18} />
                <span>Open Output Folder</span>
              </button>
            </div>
          )}

          {!result && !error && (
            <div
              style={{
                padding: 'var(--spacing-2xl)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--spacing-md)',
                }}
              >
                <SparklesIcon size={28} />
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                Ready to Generate
              </h4>
              <p style={{ fontSize: '12px' }}>
                Select an image and choose platforms to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
