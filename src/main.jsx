import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LandingPage from './LandingPage.jsx'
import { shouldShowLandingPage } from './lib/site.js'
import ReactGA from 'react-ga4'
const GA_MEASUREMENT_ID = "G-LN9VCNKLR4"; 

const showLandingPage = shouldShowLandingPage();
document.documentElement.dataset.site = showLandingPage ? 'landing' : 'app';

if (showLandingPage) {
  document.title = 'MD2MathML - Markdown to Editable Word Equations';
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    'Convert Markdown from AI chats and notes into Word documents with native, editable equations. Free and no sign-in required.',
  );
}

if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {showLandingPage ? <LandingPage /> : <App />}
  </StrictMode>,
)
