import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

/**
 * EthicsPage - Full page explaining ethics and sustainability
 * 
 * Single Responsibility: Display ethics and sustainability information as a full page
 */
export function EthicsPage() {
  return (
    <main className="ethics-page">
      <div className="ethics-page-container">
        <header className="ethics-page-header">
          <Link to="/" className="ethics-page-back-link" aria-label="Back to home">
            ← Back to Beyond Borders
          </Link>
          <h1 className="ethics-page-title">Ethics, Sustainability, and Privacy Statement</h1>
          <p className="ethics-page-intro">
            Beyond Borders is built on a foundation of <strong>ethical principles</strong>,{' '}
            <strong>sustainability</strong>, and <strong>privacy</strong>.
          </p>
          <p className="ethics-page-intro">
            It is, however, hard to do this completely in the tech world. This page aims to provide transparency about the tech used to{' '}
            build this app, and the impact of it, so that you can make a conscious choice about using it.{' '}
            Many of the big tech companies' tools and services are ubiquitous, so even if using them directly can be avoided,{' '}
            they will be used in secondary or tertiary systems. It's also difficult to claim true sustainability in tech,{' '}
            given the demand on power and cooling. There is even a significant social impact of major tech hubs where the cost{' '}
            of buying or renting property soars as tech talent moves to where the jobs are, pricing locals out of the market{' '}
            and directly increasing homelessness and rough sleeping. 
          </p>
        </header>

        <div className="ethics-page-content">
          <section className="ethics-section">
            <h2 className="ethics-section-title">Privacy First</h2>
            <ul>
              <li>All processing happens in your browser - no server uploads</li>
              <li>No tracking, analytics, or data collection</li>
              <li>Your images never leave your device</li>
              <li>Open source code for transparency</li>
            </ul>
          </section>

          <section className="ethics-section">
            <h2 className="ethics-section-title">Sustainability</h2>
            <ul>
              <li>Client-side processing reduces energy consumption and network infrastructure utilisation. Nothing is processed on remote servers</li>
              <li>No cloud infrastructure required for the backend, only for hosting the static files via GitHub</li>
              <li>The app is developed using AI tools, which will have some environmental impact through power usage and water cooling (see subsection below)</li>
            </ul>

            <h3 className="ethics-subsection-title">AI-Assisted Development</h3>
            <p>
              This application was developed with the assistance of AI tools (including Cursor, GitHub Copilot, and Claude){' '}
              for code generation, debugging, documentation, and architectural design. It wouldn't exist otherwise. Ultimately{' '}
              I had to make a compromise: increase my environmental impact so that I could put something into the world which{' '}
              would increase awareness and visibility of socio-political injustice. Realistically, the environmental impact is{' '}
              very small - I'm one person developing a small application - and I hope that the social justice impact will far{' '}
              outweigh it.
            </p>
            <p>
              Here is a generalised view of the environmental impact:
            </p>
            <p>
              Training and operating large language models requires{' '}
              substantial computational resources. A single large AI model training run can emit carbon equivalent to 5-10 cars{' '}
              over their lifetimes (approximately 300-500 metric tons of CO₂). However, using AI as a development tool{' '}
              (rather than training models from scratch) has a significantly lower impact—estimated at roughly 50-100 kg CO₂{' '}
              for the development of this application, equivalent to a few hundred miles of car travel.
            </p>
          </section>

          <section className="ethics-section">
            <h2 className="ethics-section-title">BDS Movement Compliance</h2>
            <p>
              I support the{' '}
              <a href="https://bdsmovement.net" target="_blank" rel="noopener noreferrer" className="ethics-link">
                Boycott, Divestment, and Sanctions (BDS) Movement
              </a>{' '}
              and have made efforts to avoid companies on their boycott list. However, some of the tools used in developing{' '}
              this application do fall under the boycott list, but I have not contributed financially to those organisations.
            </p>
            <p><strong>Development Tools Used:</strong></p>
            <ul>
              <li>Microsoft Visual Studio Code (code editor)</li>
              <li>Microsoft GitHub (version control and hosting)</li>
              <li>Microsoft Windows (operating system)</li>
              <li>Microsoft TypeScript (programming language - open source, but Microsoft-maintained)</li>
              <li>Meta React (JavaScript library - open source, but Meta-maintained)</li>
              <li>
                Google Fonts (Tilt Warp, Anton, Azeret Mono - fonts used in the application but self-hosted so not served by
                Google)
              </li>
            </ul>
            <p>
              <strong>Hardware:</strong> This application was developed on a Dell laptop (3 years old at time of development){' '}
              and an Intel PC (2 years old at time of development).
            </p>
            <p>
              <strong>Application Dependencies:</strong> I have verified to the best of my knowledge that none of the runtime{' '}
              dependencies or libraries used in this application are from companies on the BDS Movement boycott list. All{' '}
              dependencies are either open-source projects, neutral companies, or companies not listed by BDS.
            </p>
          </section>

          <section className="ethics-section">
            <h2 className="ethics-section-title">Ethical Development</h2>
            <ul>
              <li>It's just me, so there is no direct supply chain</li>
              <li>Built with open source tools and libraries</li>
              <li>No proprietary runtime dependencies or vendor lock-in</li>
              <li>Accessible design following WCAG guidelines</li>
              <li>Free and open source</li>
              <li>Complete transparency about development process and tools</li>
              <li>No tracking data is taken, stored, used, or shared by this application</li>
            </ul>
          </section>

          <p>
            Thanks for reading. Thanks for supporting.
          </p>
          <p>
            Nix (they/them)
          </p>
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
