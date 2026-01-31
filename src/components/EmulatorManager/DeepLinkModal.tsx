import { useState } from 'react';
import { CloseIcon, LinkIcon } from '../Icons';

interface DeepLinkModalProps {
  initialUrl: string;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

export const DeepLinkModal: React.FC<DeepLinkModalProps> = ({ initialUrl, onClose, onConfirm }) => {
  const [url, setUrl] = useState(initialUrl);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card modal-content"
        style={{ width: '500px', padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: 'var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div className="icon-container icon-container-primary">
              <LinkIcon size={20} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Open Deep Link</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost">
            <CloseIcon size={20} />
          </button>
        </div>
        <div style={{ padding: 'var(--spacing-lg)' }}>
          <label
            style={{
              display: 'block',
              marginBottom: 'var(--spacing-sm)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Enter Deep Link URL
          </label>
          <input
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              marginBottom: 'var(--spacing-lg)',
            }}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="myapp://screen/123"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onConfirm(url);
                onClose();
              }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onConfirm(url);
                onClose();
              }}
            >
              Open URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
