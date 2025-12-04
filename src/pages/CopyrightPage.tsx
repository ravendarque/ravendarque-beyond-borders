import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

/**
 * CopyrightPage - Copyright and licensing information
 *
 * Single Responsibility: Display copyright and licensing information
 */
export function CopyrightPage() {
  return (
    <main className="ethics-page">
      <div className="ethics-page-container">
        <header className="ethics-page-header">
          <Link to="/" className="ethics-page-back-link" aria-label="Back to home">
            ← Back to Beyond Borders
          </Link>
          <h1 className="ethics-page-title">Copyright and Licensing</h1>
          <p className="ethics-page-intro">
            This page provides information about copyright, licensing, and how you can use Beyond Borders.
          </p>
        </header>

        <div className="ethics-page-content">
          <section className="ethics-section">
            <h2 className="ethics-section-title">Copyright</h2>
            <p>
              © Nix Crabtree, 2025. All rights reserved.
            </p>
            <p>
              Beyond Borders is protected by copyright law in the United Kingdom and internationally. Copyright
              protection is automatic and does not require registration. As the creator of this work, I hold the
              exclusive rights to reproduce, distribute, and adapt the application.
            </p>
          </section>

          <section className="ethics-section">
            <h2 className="ethics-section-title">Open Source License</h2>
            <p>
              Despite being protected by copyright, Beyond Borders is made available as open source software. The
              source code is{' '}
              <a
                href="https://github.com/ravendarque/ravendarque-beyond-borders"
                target="_blank"
                rel="noopener noreferrer"
                className="ethics-link"
              >
                available on GitHub
              </a>
              .
            </p>
            <p>
              The specific open source license under which this software is distributed will be specified in the
              repository's LICENSE file. Please refer to that file for the exact terms and conditions under which
              you may use, modify, and distribute this software.
            </p>
          </section>

          <section className="ethics-section">
            <h2 className="ethics-section-title">Usage Rights</h2>
            <p>
              You are free to use Beyond Borders to create profile pictures with flag borders for personal or
              commercial purposes. The application processes images entirely in your browser, and you retain full
              ownership and rights to any images you create using this tool.
            </p>
            <p>
              However, the application itself (including its code, design, and functionality) remains protected by
              copyright. Any use of the source code must comply with the terms of the open source license specified
              in the repository.
            </p>
          </section>

          <section className="ethics-section">
            <h2 className="ethics-section-title">Flag Images</h2>
            <p>
              The flag images used in this application are representations of flags and are used for educational
              and awareness purposes. The copyright status of individual flag designs varies, but many national
              flags are in the public domain or are considered symbols that can be freely used. However, this
              application does not claim any copyright over the flag designs themselves.
            </p>
          </section>

          <section className="ethics-section">
            <h2 className="ethics-section-title">Contact</h2>
            <p>
              If you have questions about copyright, licensing, or usage rights, please open an issue on the{' '}
              <a
                href="https://github.com/ravendarque/ravendarque-beyond-borders"
                target="_blank"
                rel="noopener noreferrer"
                className="ethics-link"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="ethics-page-footer">
          <Link to="/" className="ethics-page-back-link">
            ← Back to Beyond Borders
          </Link>
        </footer>
      </div>
    </main>
  );
}

