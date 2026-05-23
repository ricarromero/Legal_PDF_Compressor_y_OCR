import React, { useState, useEffect } from 'react';
import { Sun, Moon, Shield } from 'lucide-react';
import PdfCompressor from './components/PdfCompressor';
import './App.css';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-layout">
      {/* Efectos de luces de fondo premium */}
      <div className="background-glow"></div>
      <div className="background-glow-left"></div>

      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-container">
            <Shield className="brand-logo-icon" />
          </div>
          <span className="brand-name">PDF<span className="brand-name-light">Compress</span></span>
        </div>

        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          aria-label="Cambiar tema visual"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {theme === 'dark' ? (
            <Sun className="theme-toggle-icon sun" />
          ) : (
            <Moon className="theme-toggle-icon moon" />
          )}
        </button>
      </header>

      <main className="app-main">
        <PdfCompressor />
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} PDF Compressor. Desarrollado con tecnología de procesamiento 100% privado en cliente.</p>
      </footer>
    </div>
  );
}
