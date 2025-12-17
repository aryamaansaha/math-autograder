import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  disabled,
  className = '', 
  ...props 
}) => {
  return (
    <button 
      className={`btn ${variant === 'secondary' ? 'btn-secondary' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && <label className="label">{label}</label>}
      <input className={`input ${className}`} {...props} />
      {error && <div className="error-text">{error}</div>}
    </div>
  );
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
};

interface ErrorModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
  title?: string;
  variant?: 'error' | 'warning' | 'info';
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ 
  show, 
  message, 
  onClose, 
  title,
  variant = 'error'
}) => {
  if (!show) return null;

  const variantStyles = {
    error: {
      icon: '⚠️',
      borderColor: '#ef4444',
      bgColor: '#fef2f2',
      titleColor: '#dc2626',
    },
    warning: {
      icon: '⚠️',
      borderColor: '#f59e0b',
      bgColor: '#fffbeb',
      titleColor: '#d97706',
    },
    info: {
      icon: 'ℹ️',
      borderColor: '#3b82f6',
      bgColor: '#eff6ff',
      titleColor: '#2563eb',
    },
  };

  const style = variantStyles[variant];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}>
        <div style={{ 
          fontSize: '2.5rem', 
          textAlign: 'center', 
          marginBottom: '1rem' 
        }}>
          {style.icon}
        </div>
        <h3 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '1.25rem', 
          fontWeight: 600,
          textAlign: 'center',
          color: style.titleColor
        }}>
          {title || (variant === 'error' ? 'Error' : variant === 'warning' ? 'Warning' : 'Notice')}
        </h3>
        <p style={{ 
          margin: '0 0 1.5rem 0', 
          color: '#64748b',
          textAlign: 'center',
          lineHeight: 1.5
        }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={onClose}>
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};
