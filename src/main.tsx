import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppStepWorkflowClean } from './pages/AppStepWorkflowClean';
import './styles.css';

const el = document.getElementById('root')!;

createRoot(el).render(
  <React.StrictMode>
    <AppStepWorkflowClean />
  </React.StrictMode>,
);
