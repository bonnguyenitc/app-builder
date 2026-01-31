import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import {
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  FolderIcon,
  SparklesIcon,
  LoaderIcon,
} from '../components/Icons';

export const KeystoreGenerator: React.FC = () => {
  const [alias, setAlias] = useState('upload');
  const [password, setPassword] = useState('');
  const [validity, setValidity] = useState(10000);
  const [keysize, setKeysize] = useState(2048);
  const [alg] = useState('RSA');

  // DName fields
  const [firstName, setFirstName] = useState('');
  const [unit, setUnit] = useState('');
  const [organization, setOrganization] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState(''); // S/ST
  const [country, setCountry] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }
    if (!alias) {
      setError('Alias is required');
      return;
    }

    try {
      const path = await save({
        title: 'Save Keystore',
        defaultPath: 'upload.jks',
        filters: [{ name: 'Keystore', extensions: ['jks', 'keystore'] }],
      });

      if (!path) return;

      setIsGenerating(true);
      setError(null);
      setResult(null);
      setOutputPath(path);

      // Construct DName
      // CN=XX, OU=XX, O=XX, L=XX, ST=XX, C=XX
      const dnameParts = [];
      if (firstName) dnameParts.push(`CN=${firstName}`);
      if (unit) dnameParts.push(`OU=${unit}`);
      if (organization) dnameParts.push(`O=${organization}`);
      if (city) dnameParts.push(`L=${city}`);
      if (state) dnameParts.push(`ST=${state}`);
      if (country) dnameParts.push(`C=${country}`);

      const dname = dnameParts.join(', ');

      const msg = await invoke<string>('generate_keystore', {
        path,
        password,
        alias,
        validity,
        keysize,
        alg,
        dname,
      });

      setResult(msg);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenOutputFolder = async () => {
    if (outputPath) {
      try {
        await invoke('show_in_folder', { path: outputPath });
      } catch (err) {
        console.error('Failed to show in folder:', err);
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #5856d6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <KeyIcon size={24} color="white" />
          </div>
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--color-text)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Keystore Generator
            </h1>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
                marginTop: '4px',
              }}
            >
              Create secure cryptographic keys for signing your Android applications
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 3fr)',
          gap: 'var(--spacing-lg)',
        }}
      >
        {/* Left Column - Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className="card">
            <div
              style={{
                marginBottom: 'var(--spacing-lg)',
                paddingBottom: 'var(--spacing-md)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Key Details</h3>
              <span className="badge badge-primary">Required</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              <div className="form-group">
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--color-text)',
                  }}
                >
                  Key Alias
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="input"
                  placeholder="e.g. upload"
                />
              </div>

              <div className="form-group">
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--color-text)',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Strong password"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--color-text)',
                  }}
                >
                  Validity (Years)
                </label>
                <input
                  type="number"
                  value={validity / 365}
                  onChange={(e) => setValidity(Math.floor(parseFloat(e.target.value) * 365))}
                  className="input"
                  placeholder="25"
                />
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    marginTop: '4px',
                    display: 'block',
                  }}
                >
                  Google recommends 25+ years
                </span>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--color-text)',
                  }}
                >
                  Key Size
                </label>
                <select
                  value={keysize}
                  onChange={(e) => setKeysize(parseInt(e.target.value))}
                  className="input"
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value={2048}>2048 bits (Standard)</option>
                  <option value={4096}>4096 bits (High Security)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div
              style={{
                marginBottom: 'var(--spacing-lg)',
                paddingBottom: 'var(--spacing-md)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Certificate Details</h3>
              <span
                className="badge badge-secondary"
                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
              >
                Optional
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  First & Last Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Organizational Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="input"
                  placeholder="Engineering"
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Organization
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="input"
                  placeholder="Company Inc."
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  City / Locality
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input"
                  placeholder="San Francisco"
                />
              </div>
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  State / Province
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input"
                  placeholder="California"
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Country Code
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="input"
                  placeholder="US"
                  maxLength={2}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          <button
            className={`btn btn-primary btn-lg ${isGenerating || !password || !alias ? 'opacity-70' : ''}`}
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              marginTop: 'var(--spacing-sm)',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            {isGenerating ? (
              <LoaderIcon className="animate-spin" size={20} />
            ) : (
              <SparklesIcon size={20} />
            )}
            <span>{isGenerating ? 'Generating Secure Keys...' : 'Generate and Save Keystore'}</span>
          </button>
        </div>

        {/* Right Column - Status */}
        <div
          className="card"
          style={{ height: 'fit-content', position: 'sticky', top: 'var(--spacing-lg)' }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: 'var(--spacing-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Generation Status
            {isGenerating && <span className="status-dot warning animate-pulse" />}
          </h3>

          {error && (
            <div
              style={{
                padding: 'var(--spacing-md)',
                backgroundColor: 'rgba(255, 59, 48, 0.05)',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-md)',
                animation: 'fadeIn 0.3s ease-out',
              }}
            >
              <div style={{ color: 'var(--color-error)', marginTop: '2px' }}>
                <XCircleIcon size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-error)',
                    marginBottom: '4px',
                  }}
                >
                  Generation Failed
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: '1.4',
                  }}
                >
                  {error}
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="animate-in fade-in duration-500">
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(52, 199, 89, 0.05) 100%)',
                  border: '1px solid rgba(52, 199, 89, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                  textAlign: 'center',
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
                    margin: '0 auto var(--spacing-sm)',
                    boxShadow: '0 4px 10px rgba(52, 199, 89, 0.3)',
                  }}
                >
                  <CheckCircleIcon size={24} color="white" />
                </div>
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '4px',
                  }}
                >
                  Success!
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Keystore generated successfully
                </p>
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Saved Location
                </label>
                <div
                  style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '12px',
                    color: 'var(--color-text)',
                    wordBreak: 'break-all',
                    lineHeight: '1.5',
                  }}
                >
                  {outputPath}
                </div>
              </div>

              <button
                className="btn btn-secondary"
                onClick={handleOpenOutputFolder}
                style={{ width: '100%' }}
              >
                <FolderIcon size={18} />
                <span>Show in Finder</span>
              </button>
            </div>
          )}

          {!result && !error && (
            <div style={{ padding: 'var(--spacing-xl) 0', textAlign: 'center', opacity: 0.6 }}>
              {isGenerating ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      border: '3px solid var(--color-border)',
                      borderTopColor: 'var(--color-primary)',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <p style={{ fontSize: '13px' }}>Generating strong keys...</p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto var(--spacing-md)',
                    }}
                  >
                    <KeyIcon size={32} color="var(--color-text-secondary)" />
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.5',
                    }}
                  >
                    Your private key is essential for app signing. <br />
                    Keep it safe and never share it.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
