export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  fontSize: '14px',
  color: 'var(--color-text)',
  transition: 'all var(--transition-fast)',
  outline: 'none',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text)',
  marginTop: '12px',
};

export const sectionStyle: React.CSSProperties = {
  padding: 'var(--spacing-md)',
  background: 'var(--color-sidebar)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
};

export const modalLayout: React.CSSProperties = {
  display: 'flex',
  height: '500px', // Fixed height for consistency
  overflow: 'hidden',
};

export const sidebarStyle: React.CSSProperties = {
  width: '200px',
  background: 'var(--color-bg)',
  borderRight: '1px solid var(--color-border)',
  padding: 'var(--spacing-md) var(--spacing-sm)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

export const sidebarItemStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px',
  fontWeight: active ? 600 : 500,
  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
  background: active ? 'var(--color-primary-light)' : 'transparent',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: 'none',
  width: '100%',
  textAlign: 'left',
});

export const contentAreaStyle: React.CSSProperties = {
  flex: 1,
  padding: 'var(--spacing-lg)',
  overflowY: 'auto',
  background: 'var(--color-surface)',
};
