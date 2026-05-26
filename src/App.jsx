import React, { useState, useEffect } from 'react';
import { Sun, Moon, Scale } from 'lucide-react';
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

      {/* NOVEDAD 2: Esferas de Cristal 3D Flotante con refracción */}
      <div className="orb-3d orb-3d-1"></div>
      <div className="orb-3d orb-3d-2"></div>

      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-container">
            <Scale className="brand-logo-icon" />
          </div>
          <span className="brand-name">DocLex <span className="brand-name-light">PDF</span></span>
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
        <p>&copy; {new Date().getFullYear()} DocLex PDF — Herramientas Jurídicas. Todo el procesamiento se realiza en local bajo estricto secreto profesional y confidencialidad técnica.</p>
      </footer>
    </div>
  );
}
