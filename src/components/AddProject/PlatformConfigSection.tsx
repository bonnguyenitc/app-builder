import React from 'react';
import { MinusIcon, PlusIcon } from '../Icons';
import { inputStyle, labelStyle, sectionStyle } from './AddProject.styles';

interface PlatformConfigSectionProps {
  title: string;
  icon: React.ReactNode;
  iconContainerClass: string;
  bundleIdLabel: string;
  bundleId: string;
  setBundleId: (val: string) => void;
  version: string;
  setVersion: (val: string) => void;
  buildNumber: number;
  setBuildNumber: (val: number) => void;
  buildNumberLabel: string;
}

export const PlatformConfigSection: React.FC<PlatformConfigSectionProps> = ({
  title,
  icon,
  iconContainerClass,
  bundleIdLabel,
  bundleId,
  setBundleId,
  version,
  setVersion,
  buildNumber,
  setBuildNumber,
  buildNumberLabel,
}) => {
  const [inputValue, setInputValue] = React.useState(buildNumber.toString());

  React.useEffect(() => {
    setInputValue(buildNumber.toString());
  }, [buildNumber]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed)) {
      setBuildNumber(parsed);
    }
  };

  const handleBlur = () => {
    if (inputValue === '' || isNaN(parseInt(inputValue))) {
      setInputValue(buildNumber.toString());
    }
  };

  const increment = () => setBuildNumber(buildNumber + 1);
  const decrement = () => setBuildNumber(Math.max(1, buildNumber - 1));

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <div className={`icon-container ${iconContainerClass}`} style={{ padding: '4px' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '14px', fontWeight: 600 }}>{title}</h3>
      </div>

      <div style={sectionStyle}>
        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
          <label style={labelStyle}>{bundleIdLabel}</label>
          <input
            style={inputStyle}
            value={bundleId}
            onChange={(e) => setBundleId(e.target.value)}
            placeholder="com.example.app"
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-sm)',
          }}
        >
          <div>
            <label style={labelStyle}>Version</label>
            <input
              style={inputStyle}
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
            />
          </div>
          <div>
            <label style={labelStyle}>{buildNumberLabel}</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                height: '40px',
                overflow: 'hidden',
                transition: 'all var(--transition-fast)',
              }}
            >
              <button
                type="button"
                onClick={decrement}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <MinusIcon size={14} />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                style={{
                  flex: 1,
                  border: 'none',
                  textAlign: 'center',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  width: '100%',
                  outline: 'none',
                  padding: 0,
                }}
              />
              <button
                type="button"
                onClick={increment}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <PlusIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
