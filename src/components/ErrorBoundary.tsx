import { Component, ReactNode } from 'react';
import { Alert, AlertTitle, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { normalizeError, AppError } from '@/types/errors';

export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  
  /** Optional fallback UI */
  fallback?: (error: AppError, reset: () => void) => ReactNode;
  
  /** Callback when error occurs */
  onError?: (error: AppError) => void;
}

interface ErrorBoundaryState {
  error: AppError | null;
  hasError: boolean;
}

/**
 * ErrorBoundary Component
 * 
 * Catches React errors and displays user-friendly fallback UI.
 * Prevents the entire app from crashing due to component errors.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: normalizeError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error callback
    if (this.props.onError && this.state.error) {
      this.props.onError(this.state.error);
    }
  }

  handleReset = (): void => {
    // Reset error state
    this.setState({
      error: null,
      hasError: false,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Paper sx={{ p: 4 }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Something Went Wrong</AlertTitle>
              {this.state.error.userMessage}
            </Alert>

            <Stack spacing={2}>
              <Typography variant="body1">
                {this.state.error.recoverySuggestion || 
                  'Please try refreshing the page. If the problem persists, contact support.'}
              </Typography>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </Stack>

              <details style={{ marginTop: '16px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Technical Details (for debugging)
                </summary>
                <pre style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                }}>
                  {JSON.stringify(this.state.error.toJSON(), null, 2)}
                </pre>
              </details>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}
