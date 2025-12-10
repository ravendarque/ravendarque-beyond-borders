import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { FlagSpec } from '@/flags/schema';

export interface FlagDetailsModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for open state changes */
  onOpenChange: (open: boolean) => void;
  /** Flag to display details for */
  flag: FlagSpec | null;
}

/**
 * FlagDetailsModal - Modal dialog showing detailed information about a flag
 * 
 * Single Responsibility: Display comprehensive flag information
 */
export function FlagDetailsModal({ open, onOpenChange, flag }: FlagDetailsModalProps) {
  if (!flag) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content 
          className="dialog-content" 
          aria-describedby="flag-details-description"
          onOpenAutoFocus={(e) => {
            // Scroll to top when dialog opens
            e.preventDefault();
            const content = e.currentTarget as HTMLDivElement;
            if (content) {
              content.scrollTop = 0;
            }
          }}
        >
          <Dialog.Close asChild>
            <button 
              className="dialog-close-button"
              aria-label="Close dialog"
            >
              ×
            </button>
          </Dialog.Close>
          <Dialog.Title className="dialog-title">
            {flag.name || flag.displayName}
          </Dialog.Title>
          
          <div className="dialog-body" id="flag-details-description">
            {flag.reason && (
              <div className="flag-detail-narrative">
                <p className="flag-detail-reason">{flag.reason}</p>
              </div>
            )}

            {flag.references && flag.references.length > 0 && (
              <div className="flag-detail-references">
                <h3 className="flag-detail-label">Further reading</h3>
                <ul className="flag-reference-list">
                  {flag.references.map((ref, index) => (
                    <li key={index}>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dialog-link"
                      >
                        {ref.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="dialog-actions">
            <Dialog.Close asChild>
              <button className="dialog-button">
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

