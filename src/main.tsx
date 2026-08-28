import { render } from 'preact';
import { App } from './App';
import './styles.css';

render(<App />, document.getElementById('app')!);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const hadController = Boolean(navigator.serviceWorker.controller);
      const registration = await navigator.serviceWorker.register('/sw.js');
      if (registration.waiting) window.dispatchEvent(new CustomEvent('feedback-app-update', { detail: registration.waiting }));
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('feedback-app-update', { detail: worker }));
          }
        });
      });
      if (hadController) {
        let reloading = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!reloading) { reloading = true; location.reload(); }
        });
      }
    } catch { /* the app remains usable without installability */ }
  });
}
