import { createRoot } from 'react-dom/client';
import '@fontsource/inter-tight/400.css';
import '@fontsource/inter-tight/500.css';
import '@fontsource/inter-tight/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import 'lenis/dist/lenis.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/stage.css';
import './styles/nav.css';
import './styles/sections.css';
import './styles/lineup.css';
import './styles/buy.css';
import './styles/responsive.css';
import { App } from './App';

// No StrictMode: its double-mounted effects would create two WebGL contexts on
// one canvas. The Experience owns an airtight init/dispose instead.
createRoot(document.getElementById('root')!).render(<App />);
