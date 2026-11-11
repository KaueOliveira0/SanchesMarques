import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './registerSW';

// Registra o Service Worker para funcionamento offline e instalação como aplicativo
registerServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
