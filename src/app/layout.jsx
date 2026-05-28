// src/app/layout.jsx
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Outfit } from 'next/font/google';
import useAuthStore from '../stores/authStore.js';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'] });

const NavigationBar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent border-b border-slate-800/40">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-slate-950 font-bold">🎬</span>
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
            CineVerse
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!mounted ? (
            <div className="h-8 w-16 bg-slate-900 rounded-xl animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="bg-slate-900/80 hover:bg-slate-800 text-amber-500 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span>📊</span>
                  <span className="hidden sm:inline">Admin Desk</span>
                </Link>
              )}
              <Link
                href="/profile"
                className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span className="text-amber-500">👤</span>
                <span>{user.firstName || 'Profile'}</span>
              </Link>
              <button
                onClick={() => { logout(); router.push('/login'); }}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                title="Log Out"
              >
                <span>🚪</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/10"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default function RootLayout({ children }) {
  // Sync hydration of auth store
  useEffect(() => {
    // Perform any hydration sync if needed
  }, []);

  return (
    <html lang="en">
      <head>
        <title>CineVerse | Premium Movie Booking Platform</title>
        <meta name="description" content="Book tickets for the latest blockbusters with real-time seat selection and luxurious recliner choices." />
      </head>
      <body className={`${outfit.className} bg-slate-950 text-white antialiased selection:bg-amber-500 selection:text-slate-950`}>
        <div className="relative font-sans">
          <NavigationBar />
          {children}
        </div>
      </body>
    </html>
  );
}
