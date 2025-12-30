import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import SurahDetail from './pages/SurahDetail';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import SettingsDrawer from './components/SettingsDrawer';
import PasswordForm from './components/PasswordForm';
import NetworkStatus from './components/NetworkStatus';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PasswordForm />;
  }

  return (
    <Router>
      <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Header />
        <SettingsDrawer />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/surah/:id" element={<SurahDetail />} />
          </Routes>
        </main>
        <footer className="bg-white dark:bg-slate-900 py-8 mt-12 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 text-center text-gray-400 dark:text-gray-500 text-sm">
            <p>Made with ❤️ by 7 Surat Pilihan</p>
            <p className="mt-1">Data provided by Quran.com API v4</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <NetworkProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NetworkProvider>
    </SettingsProvider>
  );
};

export default App;