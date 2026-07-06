
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker for PWA functionality
const isIframe = window.self !== window.top;
const isDev = window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' || 
            window.location.hostname.indexOf('run.app') !== -1 ||
            window.location.hostname.indexOf('webcontainer') !== -1 ||
            window.location.hostname.indexOf('aistudio') !== -1;

if ('serviceWorker' in navigator && !isIframe && !isDev) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.warn('SW registration failed: ', registrationError);
      });
    } catch (err) {
      console.warn('SW registration threw an error:', err);
    }
  });
}