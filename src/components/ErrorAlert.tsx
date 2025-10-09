import { Alert, AlertTitle, Button, Stack } from '@mui/material';
import { AppError } from '@/types/errors';

export interface ErrorAlertProps {
  /** The error to display */
  error: AppError | null;
  
  /** Callback when user clicks "Try Again" */
  onRetry?: () => void;
  
  /** Callback when user dismisses the error */
  onDismiss?: () => void;
  
  /** Severity level (default: based on error code) */
  severity?: 'error' | 'warning' | 'info';
  
  /** Show detailed technical message (default: false) */
  showDetails?: boolean;
}

/**
 * ErrorAlert Component
 * 
 * Displays user-friendly error messages with optional retry and dismiss actions.
 * 
 * @example
 * ```tsx
 * <ErrorAlert
 *   error={error}
 *   onRetry={() => refetch()}
 *   onDismiss={() => setError(null)}
 * />
 * ```
 */
export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  severity = 'error',
  showDetails = false,
}: ErrorAlertProps) {
  if (!error) {
    return null;
  }

  return (
    <Alert
      severity={severity}
      onClose={onDismiss}
      sx={{ mb: 2 }}
    >
      <AlertTitle>Error</AlertTitle>
      
      {error.userMessage}
      
      {error.recoverySuggestion && (
        <div style={{ marginTop: '8px', fontSize: '0.875rem', opacity: 0.9 }}>
          <strong>Suggestion:</strong> {error.recoverySuggestion}
        </div>
      )}
      
      {showDetails && error.message && (
        <div style={{ marginTop: '8px', fontSize: '0.75rem', fontFamily: 'monospace', opacity: 0.7 }}>
          Technical details: {error.message}
        </div>
      )}
      
      {(error.canRetry && onRetry) && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={onRetry}
            color="inherit"
          >
            Try Again
          </Button>
        </Stack>
      )}
    </Alert>
  );
}
