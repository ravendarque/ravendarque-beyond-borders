import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppStepWorkflow } from './pages/AppStepWorkflow';
import { EthicsPage } from './pages/EthicsPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { config } from './config';
import './styles.css';

const el = document.getElementById('root')!;

createRoot(el).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={config.getBaseUrl()}>
        <Routes>
          <Route path="/" element={<AppStepWorkflow />} />
          <Route path="/ethics" element={<EthicsPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
