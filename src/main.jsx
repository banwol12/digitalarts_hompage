import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { installSiteGlobals } from './lib/siteGlobals';
import { installPortfolioAPI } from './lib/portfolioApi';
import { initLang } from './lib/i18n';

installSiteGlobals();
installPortfolioAPI();
initLang();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
