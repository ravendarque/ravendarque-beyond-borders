import React from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';

export interface PrivacyModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * PrivacyModal - Modal dialog explaining privacy policy
 * 
 * Single Responsibility: Display privacy information to users
 */
export function PrivacyModal({ open, onOpenChange }: PrivacyModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content 
          className="dialog-content" 
          aria-describedby="privacy-dialog-description"
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
          <Dialog.Title className="dialog-title">Your Privacy is Protected</Dialog.Title>
          
          <div className="dialog-body">
            <p id="privacy-dialog-description">
              Beyond Borders processes everything <strong>directly in your browser</strong>. Your images never leave your device.
            </p>
            
            <p><strong>What this means:</strong></p>
            
            <ul>
              <li>✓ No uploads to servers</li>
              <li>✓ No cloud storage</li>
              <li>✓ No tracking or analytics</li>
              <li>✓ Complete privacy and control</li>
            </ul>
            
            <p>
              All image processing happens using HTML5 Canvas technology in your browser. When you download your avatar, it's created and saved directly on your device. We never see, store, or have access to your images.
            </p>
            
            <p>
              This is an open source project so if you want to look through the code, it's{' '}
              <a
                href="https://github.com/ravendarque/ravendarque-beyond-borders"
                target="_blank"
                rel="noopener noreferrer"
                className="dialog-link"
              >
                here on GitHub
              </a>
              .
            </p>

            <p>
              For more detailed information please read the{' '}
              <Link
                to="/ethics"
                className="dialog-link"
                onClick={() => onOpenChange(false)}
              >
                Ethics, Sustainability, and Privacy Statement.
              </Link>
            </p>
          </div>

          <div className="dialog-actions">
            <Dialog.Close asChild>
              <button className="dialog-button">
                Got it
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

