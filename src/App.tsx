import React from 'react';
/** 
 * @license 
 * SPDX-License-Identifier: Apache-2.0 
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Home } from './components/home/Home';
import { PrayerPage } from './components/prayer/PrayerPage';
import { QuranList } from './components/quran/QuranList';
import { SurahView } from './components/quran/SurahView';
import { Store } from './components/store/Store';
import { Admin } from './components/admin/Admin';
import { Adhkar } from './components/adhkar/Adhkar';
import { Duas } from './components/duas/Duas';
import { Profile } from './components/profile/Profile';
import { Prime } from './components/prime/Prime';
import { Redeem } from './components/redeem/Redeem';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { Inventory } from './components/inventory/Inventory';
import { Mail } from './components/mail/Mail';
import { Support } from './components/support/Support';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) return <div className="p-8 text-center text-white/50 animate-pulse">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/prayer" element={<PrayerPage />} />
            <Route path="/quran" element={<QuranList />} />
            <Route path="/quran/:id" element={<SurahView />} />
            <Route path="/store" element={<Store />} />
            <Route path="/adhkar" element={<Adhkar />} />
            <Route path="/duas" element={<Duas />} />
            <Route path="/prime" element={<Prime />} />

            {/* Protected User Routes */}
            <Route path="/support" element={
              <ProtectedRoute><Support /></ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute><Inventory /></ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute><Leaderboard /></ProtectedRoute>
            } />
            <Route path="/mail" element={
              <ProtectedRoute><Mail /></ProtectedRoute>
            } />
            <Route path="/redeem" element={
              <ProtectedRoute><Redeem /></ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            
            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin><Admin /></ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
