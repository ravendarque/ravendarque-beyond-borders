import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppStepWorkflow } from './pages/AppStepWorkflow';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';

const el = document.getElementById('root')!;

createRoot(el).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppStepWorkflow />
    </ErrorBoundary>
  </React.StrictMode>,
);
