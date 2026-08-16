import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initSettingsInterceptor } from './settingsPrefs.js'

import StandalonePayslip from './components/StandalonePayslip.jsx'

initSettingsInterceptor();

// Patch localStorage to prevent QuotaExceededError crashes
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  try {
    originalSetItem.apply(this, arguments);
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn('LocalStorage quota exceeded! Clearing large caches...');
      localStorage.removeItem('pontage_sites_cache');
      localStorage.removeItem('pontage_payroll_statuses');
      localStorage.removeItem('pontage_payroll_activeSite');
      try {
        originalSetItem.apply(this, arguments);
      } catch (innerE) {
        console.error('Still unable to save to localStorage after clearing cache', innerE);
      }
    } else {
      throw e;
    }
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: '#fdd', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const isPrintPayslip = window.location.search.includes('print_payslip=true');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isPrintPayslip ? <StandalonePayslip /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)
