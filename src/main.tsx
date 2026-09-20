import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('NutriControl render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#0b0f17', color: '#fff', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: 720, width: '100%', background: '#151b27', border: '1px solid #334155', borderRadius: 16, padding: 24, boxSizing: 'border-box' }}>
            <h1 style={{ marginTop: 0 }}>NutriControl</h1>
            <p style={{ color: '#fca5a5' }}>La aplicación encontró un error al iniciar.</p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#cbd5e1', fontSize: 13 }}>{this.state.error.message || String(this.state.error)}</pre>
            <button onClick={() => location.reload()} style={{ marginTop: 12, border: 0, borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}>Recargar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');

if (!root) {
  document.body.innerHTML = '<div style="padding:24px;font-family:system-ui,sans-serif;background:#0b0f17;color:#fff;min-height:100vh">NutriControl: no se encontró el contenedor de la aplicación.</div>';
} else {
  window.addEventListener('error', (event) => {
    console.error('NutriControl global error:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('NutriControl unhandled rejection:', event.reason);
  });

  createRoot(root).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>
  );
}
