/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { RegisterForm, SuccessScreen } from './components/RegisterForm';
import { ApplicantLogin, AdminLogin } from './components/AuthPages';
import { ApplicantDashboard } from './components/ApplicantDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { VerificationPage } from './components/VerificationPage';
import { Toaster } from './components/ui/sonner';

type Page = 'landing' | 'register' | 'register-success' | 'login' | 'admin-login' | 'dashboard' | 'admin-dashboard' | 'verify';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<any>(null);
  const [regId, setRegId] = useState('');

  // Simple state-based routing
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.slice(1) as Page;
      if (['landing', 'register', 'login', 'admin-login', 'verify'].includes(path)) {
        setCurrentPage(path || 'landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.history.pushState(null, '', `/${page === 'landing' ? '' : page}`);
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    if (userData.role === 'admin') {
      navigate('admin-dashboard');
    } else {
      navigate('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('landing');
  };

  const handleRegisterSuccess = (id: string) => {
    setRegId(id);
    navigate('register-success');
  };

  return (
    <div className="min-h-screen font-sans antialiased text-slate-900">
      {currentPage === 'landing' && <LandingPage onNavigate={navigate as any} />}
      {currentPage === 'register' && <RegisterForm onSuccess={handleRegisterSuccess} onNavigate={navigate as any} />}
      {currentPage === 'register-success' && <SuccessScreen regId={regId} onNavigate={navigate as any} />}
      {currentPage === 'login' && <ApplicantLogin onNavigate={navigate as any} onLogin={handleLogin} />}
      {currentPage === 'admin-login' && <AdminLogin onNavigate={navigate as any} onLogin={handleLogin} />}
      {currentPage === 'dashboard' && <ApplicantDashboard user={user} onLogout={handleLogout} />}
      {currentPage === 'admin-dashboard' && <AdminDashboard onLogout={handleLogout} />}
      {currentPage === 'verify' && <VerificationPage onNavigate={navigate as any} />}
      
      <Toaster />
    </div>
  );
}
