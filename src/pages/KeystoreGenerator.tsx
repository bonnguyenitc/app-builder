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
  ShieldCheckIcon,
  InfoIcon,
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
    <div
      className="page-container"
      style={{
        padding: 'var(--spacing-2xl)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Premium Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
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
              Security Suite
            </span>
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--color-text)',
              letterSpacing: '-0.02em',
            }}
          >
            Keystore Foundry
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginTop: '4px' }}>
            Forge secure cryptographic identities for Android application signing.
          </p>
        </div>

        <div
          style={{
            background: 'var(--color-sidebar)',
            padding: '12px 24px',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ShieldCheckIcon size={20} style={{ color: 'var(--color-success)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            FIPS Compliant RSA
          </span>
        </div>
      </header>

      {/* Main Content Area - Single Viewport Layout */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '32px',
          minHeight: 0,
          animation: 'fadeIn 0.6s ease',
        }}
      >
        {/* Left Column - Form (Scrollable internally) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            overflowY: 'auto',
            paddingRight: '8px',
            minHeight: 0,
          }}
        >
          {/* Key Credentials Section */}
          <section
            className="card"
            style={{
              padding: '24px',
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(0, 122, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <KeyIcon size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Primary Identity</h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px',
              }}
            >
              <div className="form-group">
                <label className="input-label">Key Alias</label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="input"
                  placeholder="e.g. production_key"
                  style={{ background: 'var(--color-sidebar)', borderRadius: '12px' }}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Master Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••••••"
                  style={{ background: 'var(--color-sidebar)', borderRadius: '12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="input-label">Validity Period (Years)</label>
                <input
                  type="number"
                  value={validity / 365}
                  onChange={(e) => setValidity(Math.floor(parseFloat(e.target.value) * 365))}
                  className="input"
                  style={{ background: 'var(--color-sidebar)', borderRadius: '12px' }}
                />
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-tertiary)',
                    marginTop: '6px',
                  }}
                >
                  Standard industry recommendation is 25+ years.
                </p>
              </div>
              <div className="form-group">
                <label className="input-label">Cipher Strength</label>
                <select
                  value={keysize}
                  onChange={(e) => setKeysize(parseInt(e.target.value))}
                  className="input"
                  style={{
                    background: 'var(--color-sidebar)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <option value={2048}>RSA 2048-bit (Standard)</option>
                  <option value={4096}>RSA 4096-bit (Paranoid)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Certificate Information Section */}
          <section
            className="card"
            style={{
              padding: '24px',
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(52, 199, 89, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheckIcon size={20} style={{ color: 'var(--color-success)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Certificate Subject</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  Metadata embedded within the signature.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px',
              }}
            >
              <div className="form-group">
                <label className="input-label">Common Name (CN)</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                  placeholder="Full Name"
                  style={{ background: 'var(--color-sidebar)', borderRadius: '12px' }}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Organization (O)</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="input"
                  placeholder="Company Name"
                  style={{ background: 'var(--color-sidebar)', borderRadius: '12px' }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px',
              }}
            >
              <div className="form-group">
                <label className="input-label">Org. Unit (OU)</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="input"
                  placeholder="e.g. IT, Mobile"
                  style={{ background: 'var(--color-sidebar)', borderRadius: '12px' }}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Locality (L)</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input"
                  placeholder="City"
                  style={{ background: 'var(--color-sidebar)', borderRadius: '12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="input-label">State / Prov. (ST)</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input"
                  placeholder="State"
                  style={{ background: 'var(--color-sidebar)', borderRadius: '12px' }}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Country Code (C)</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="input"
                  placeholder="US"
                  maxLength={2}
                  style={{
                    background: 'var(--color-sidebar)',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                  }}
                />
              </div>
            </div>
          </section>

          {/* Action Button */}
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating || !password || !alias}
            style={{
              height: '56px',
              borderRadius: '18px',
              fontSize: '16px',
              fontWeight: 700,
              marginTop: '4px',
              boxShadow: '0 12px 24px rgba(0, 122, 255, 0.2)',
              flexShrink: 0,
            }}
          >
            {isGenerating ? (
              <LoaderIcon size={20} className="animate-spin" />
            ) : (
              <SparklesIcon size={20} />
            )}
            <span>{isGenerating ? 'Synthesizing RSA Entropy...' : 'Generate Secure Keystore'}</span>
          </button>
        </div>

        {/* Right Column - Status & Output */}
        <div
          className="card"
          style={{
            padding: '32px',
            borderRadius: '28px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
            Foundry Output
          </h3>

          {error && (
            <div
              style={{
                background: 'rgba(255, 59, 48, 0.08)',
                border: '1px solid rgba(255, 59, 48, 0.2)',
                padding: '20px',
                borderRadius: '18px',
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <XCircleIcon size={20} style={{ color: 'var(--color-error)' }} />
              <div>
                <div
                  style={{
                    color: 'var(--color-error)',
                    fontSize: '15px',
                    fontWeight: 700,
                    marginBottom: '4px',
                  }}
                >
                  Operation Blocked
                </div>
                <div style={{ color: 'var(--color-error)', fontSize: '13px', opacity: 0.8 }}>
                  {error}
                </div>
              </div>
            </div>
          )}

          {result ? (
            <div
              style={{
                animation: 'fadeIn 0.5s ease',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}
            >
              <div
                style={{
                  background: 'rgba(52, 199, 89, 0.08)',
                  border: '1px solid rgba(52, 199, 89, 0.2)',
                  padding: '32px 24px',
                  borderRadius: '24px',
                  textAlign: 'center',
                  marginBottom: '32px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 16px rgba(52, 199, 89, 0.3)',
                  }}
                >
                  <CheckCircleIcon size={28} color="white" />
                </div>
                <h4
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    marginBottom: '8px',
                  }}
                >
                  Identity Secured
                </h4>
                <p
                  style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}
                >
                  Your cryptographic keystore has been successfully minted and stored.
                </p>
              </div>

              <div
                style={{
                  background: 'var(--color-sidebar)',
                  padding: '24px',
                  borderRadius: '20px',
                  border: '1px solid var(--color-border)',
                  flex: 1,
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                  }}
                >
                  Artifact Path
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    fontFamily: '"SF Mono", monospace',
                    wordBreak: 'break-all',
                    lineHeight: 1.6,
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '12px',
                  }}
                >
                  {outputPath}
                </div>
              </div>

              <button
                className="btn btn-secondary"
                onClick={handleOpenOutputFolder}
                style={{ height: '52px', borderRadius: '16px', fontSize: '15px', fontWeight: 700 }}
              >
                <FolderIcon size={18} />
                <span>Open Folder</span>
              </button>
            </div>
          ) : isGenerating ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ marginBottom: '24px', position: 'relative' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: '4px solid rgba(255,255,255,0.05)',
                    borderTopColor: 'var(--color-primary)',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyIcon size={32} style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
                </div>
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
                Minting Keys
              </h4>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--color-text-tertiary)',
                  textAlign: 'center',
                  maxWidth: '240px',
                }}
              >
                Gathering entropy for secure RSA keypair generation...
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
                opacity: 0.6,
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '32px',
                  background: 'var(--color-sidebar)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                }}
              >
                <InfoIcon size={32} style={{ opacity: 0.3 }} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                Ready to Mint
              </h4>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-tertiary)',
                  textAlign: 'center',
                  maxWidth: '240px',
                }}
              >
                Complete the identity form and choose a location to generate your key.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-tertiary);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
