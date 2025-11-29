import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          fontFamily: 'sans-serif',
          maxWidth: '800px',
          margin: '50px auto'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>
            ⚠️ Something went wrong
          </h1>
          <div style={{ 
            background: '#f3f4f6', 
            padding: '16px', 
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Error:</p>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              fontSize: '14px'
            }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
          </button>
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
            <p>Check the browser console (F12) for more details.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

