import LoadingSpinner from './LoadingSpinner'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'small' | 'medium' | 'large'
  type?: 'button' | 'submit' | 'reset'
  className?: string
  dataTestId?: string
}

export default function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingText,
  variant = 'primary',
  size = 'medium',
  type = 'button',
  className = '',
  dataTestId
}: ButtonProps) {
  const variantStyles = {
    primary: {
      background: '#2196F3',
      color: 'white',
      border: '1px solid #2196F3',
      hover: { background: '#1976D2', border: '1px solid #1976D2' }
    },
    secondary: {
      background: '#f5f5f5',
      color: '#333',
      border: '1px solid #ddd',
      hover: { background: '#e0e0e0', border: '1px solid #ccc' }
    },
    danger: {
      background: '#f44336',
      color: 'white',
      border: '1px solid #f44336',
      hover: { background: '#d32f2f', border: '1px solid #d32f2f' }
    },
    success: {
      background: '#4CAF50',
      color: 'white',
      border: '1px solid #4CAF50',
      hover: { background: '#388E3C', border: '1px solid #388E3C' }
    }
  }

  const sizeStyles = {
    small: { padding: '6px 12px', fontSize: '12px' },
    medium: { padding: '8px 16px', fontSize: '14px' },
    large: { padding: '12px 24px', fontSize: '16px' }
  }

  const style = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={dataTestId}
      className={`custom-button ${className}`}
      style={{
        ...sizeStyle,
        background: style.background,
        color: style.color,
        border: style.border,
        borderRadius: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minWidth: 'fit-content'
      }}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" color={style.color} />
          {loadingText || children}
        </>
      ) : (
        children
      )}
      
      <style>{`
        .custom-button:hover:not(:disabled) {
          background: ${style.hover.background} !important;
          border: ${style.hover.border} !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .custom-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        
        .custom-button:focus {
          outline: 2px solid ${style.background}40;
          outline-offset: 2px;
        }
      `}</style>
    </button>
  )
}
