import { useState, useEffect } from 'react';
import { LinkIcon } from '../Icons';

interface DeepLinkModalProps {
  initialUrl: string;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

export const DeepLinkModal: React.FC<DeepLinkModalProps> = ({ initialUrl, onClose, onConfirm }) => {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.7)', zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="card modal-content"
        style={{
          maxWidth: '480px',
          padding: '32px',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(0, 122, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <LinkIcon size={32} style={{ color: 'var(--color-primary)' }} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
          Open Deep Link
        </h2>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginBottom: '32px',
            textAlign: 'center',
            fontSize: '15px',
          }}
        >
          Direct orchestrate your application by sending a custom URL scheme to the device.
        </p>

        <div style={{ marginBottom: '32px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '10px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            URL Protocol & Path
          </label>
          <input
            autoFocus
            className="input"
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--color-sidebar)',
              fontSize: '16px',
              fontWeight: 500,
              padding: '0 20px',
            }}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="myapp://screen/details?id=1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onConfirm(url);
                onClose();
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1, height: '48px', borderRadius: '14px' }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onConfirm(url);
              onClose();
            }}
            style={{
              flex: 1,
              height: '48px',
              borderRadius: '14px',
              boxShadow: '0 8px 16px rgba(0, 122, 255, 0.2)',
            }}
          >
            Open Link
          </button>
        </div>
      </div>
    </div>
  );
};
