import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppStepWorkflow } from './pages/AppStepWorkflow';
import './styles.css';

const el = document.getElementById('root')!;

createRoot(el).render(
  <React.StrictMode>
    <AppStepWorkflow />
  </React.StrictMode>,
);
