import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useKdpStore } from './store';
import './styles.css';

function Root() {
  const store = useKdpStore();
  return <App store={store} />;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
