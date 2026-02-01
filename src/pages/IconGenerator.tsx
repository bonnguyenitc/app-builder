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
  RefreshCwIcon,
  LoaderIcon,
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
        filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg'] }],
      });

      if (selected && typeof selected === 'string') {
        setSelectedImage(selected);
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

    const outputPath = await open({
      directory: true,
      multiple: false,
    });

    if (!outputPath || typeof outputPath !== 'string') return;

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
    <div
      className="page-container"
      style={{
        padding: 'var(--spacing-2xl)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '1600px',
        margin: '0 auto',
      }}
    >
      {/* Premium Header */}
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
            Icon Suite
          </h1>
        </div>

        {selectedImage && !isGenerating && (
          <button
            className="btn btn-ghost"
            onClick={handleReset}
            style={{
              height: '38px',
              borderRadius: '10px',
              fontSize: '13px',
              color: 'var(--color-text-tertiary)',
            }}
          >
            <RefreshCwIcon size={14} />
            <span>Reset Canvas</span>
          </button>
        )}
      </header>

      {/* Main Content Area - Fixed in viewport */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '24px',
          minHeight: 0,
          animation: 'fadeIn 0.6s ease',
        }}
      >
        {/* Left Side: Upload & Platforms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>
          {/* Source Image Card - Takes available space */}
          <div
            className="card"
            style={{
              padding: '24px',
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              minHeight: 0,
              animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
            }}
          >
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>
                Source Asset
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                Main artwork for generation.
              </p>
            </div>

            <div
              onClick={handleImageSelect}
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: '20px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                backgroundColor: 'var(--color-sidebar)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                minHeight: 0,
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.backgroundColor = 'rgba(0, 122, 255, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.backgroundColor = 'var(--color-sidebar)';
              }}
            >
              {imagePreview ? (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '24px',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
                      objectFit: 'contain',
                    }}
                  />
                  <p
                    style={{
                      marginTop: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                    }}
                  >
                    Replace Artwork
                  </p>
                </div>
              ) : (
                <>
                  <ImageIcon
                    size={40}
                    style={{ color: 'var(--color-text-tertiary)', marginBottom: '16px' }}
                  />
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                    Select Image
                  </h4>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-tertiary)',
                      maxWidth: '200px',
                      lineHeight: 1.5,
                    }}
                  >
                    PNG/JPG recommended (1024x1024)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Platforms Card - Fixed height at bottom */}
          <div
            className="card"
            style={{
              padding: '24px',
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flexShrink: 0,
              animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Targets</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => togglePlatform('ios')}
                style={{
                  flex: 1,
                  height: '52px',
                  borderRadius: '14px',
                  border: '1px solid var(--color-border)',
                  background: platforms.includes('ios')
                    ? 'rgba(0, 122, 255, 0.08)'
                    : 'var(--color-sidebar)',
                  color: platforms.includes('ios')
                    ? 'var(--color-primary)'
                    : 'var(--color-text-tertiary)',
                  borderColor: platforms.includes('ios')
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <AppleIcon size={18} /> iOS
              </button>
              <button
                onClick={() => togglePlatform('android')}
                style={{
                  flex: 1,
                  height: '52px',
                  borderRadius: '14px',
                  border: '1px solid var(--color-border)',
                  background: platforms.includes('android')
                    ? 'rgba(52, 199, 89, 0.08)'
                    : 'var(--color-sidebar)',
                  color: platforms.includes('android')
                    ? 'var(--color-success)'
                    : 'var(--color-text-tertiary)',
                  borderColor: platforms.includes('android')
                    ? 'var(--color-success)'
                    : 'var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <AndroidIcon size={18} /> Android
              </button>
            </div>
            {platforms.includes('android') && (
              <input
                type="text"
                className="input"
                value={androidIconName}
                onChange={(e) => setAndroidIconName(e.target.value)}
                placeholder="Android Icon Name (ic_launcher)"
                style={{
                  height: '44px',
                  borderRadius: '10px',
                  background: 'var(--color-sidebar)',
                  fontSize: '14px',
                }}
              />
            )}
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={!selectedImage || platforms.length === 0 || isGenerating}
              style={{ height: '52px', borderRadius: '14px', fontSize: '15px', fontWeight: 700 }}
            >
              {isGenerating ? (
                <LoaderIcon size={18} className="animate-spin" />
              ) : (
                <SparklesIcon size={18} />
              )}
              <span>{isGenerating ? 'Generating...' : 'Start Generation'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Results - Scrollable internally if needed but fixed in viewport */}
        <div
          className="card"
          style={{
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>
            Process Output
          </h3>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            {error && (
              <div
                style={{
                  background: 'rgba(255, 59, 48, 0.08)',
                  border: '1px solid rgba(255, 59, 48, 0.2)',
                  padding: '16px',
                  borderRadius: '16px',
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                <XCircleIcon size={18} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                <span style={{ color: 'var(--color-error)', fontSize: '13px', fontWeight: 500 }}>
                  {error}
                </span>
              </div>
            )}

            {result?.success ? (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div
                  style={{
                    background: 'rgba(52, 199, 89, 0.08)',
                    border: '1px solid rgba(52, 199, 89, 0.2)',
                    padding: '24px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    marginBottom: '24px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <CheckCircleIcon size={20} color="white" />
                  </div>
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: 'var(--color-success)',
                      marginBottom: '4px',
                    }}
                  >
                    Done!
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Assets exported successfully.
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--color-sidebar)',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: 'var(--color-text-tertiary)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    Location
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '10px',
                    }}
                  >
                    {result.output_path}
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={handleOpenOutputFolder}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  <FolderIcon size={18} /> Reveal Assets
                </button>
              </div>
            ) : !isGenerating ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.4,
                }}
              >
                <SparklesIcon size={40} style={{ marginBottom: '16px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Ready</h4>
                <p style={{ fontSize: '12px', textAlign: 'center', maxWidth: '180px' }}>
                  Waiting for configuration...
                </p>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LoaderIcon
                  size={40}
                  className="animate-spin"
                  style={{ color: 'var(--color-primary)', marginBottom: '16px' }}
                />
                <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Synthesizing...</h4>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
