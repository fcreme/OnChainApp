interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  text?: string
  className?: string
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color = '#14B8A6',
  text,
  className = ''
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px'
  }

  const spinnerSize = sizeMap[size]

  return (
    <div 
      data-testid="loading-spinner"
      className={`loading-spinner ${className}`}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `2px solid #f3f3f3`,
          borderTop: `2px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          filter: 'drop-shadow(0 0 8px rgba(20,184,166,0.3))'
        }}
      />
      {text && (
        <span style={{ 
          fontSize: size === 'small' ? '12px' : '14px',
          color: '#666'
        }}>
          {text}
        </span>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-spinner {
          transition: opacity 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
