// src/app/page.jsx
"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api.js';
import MovieCard from '@/components/MovieCard.jsx';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('now_showing');

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const endpoint = searchQuery.length >= 2 
          ? `/movies/search?q=${searchQuery}` 
          : `/movies?status=${activeTab}`;
        const response = await api.get(endpoint);
        setMovies(response.data.data || []);
        setLoading(false);
      } catch (error) {
        setMovies([]);
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchMovies();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Hero Banner */}
      <div className="relative pt-32 pb-20 md:py-40 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md"
          >
            <span>✨</span>
            <span>Experience Cinema Premium</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6"
          >
            Book Tickets For The <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
              Finest Blockbusters
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base mb-10 font-medium"
          >
            Select your favorite seats in real-time, order premium gourmet foods, and unlock ultra-luxurious recliner cinema viewings instantly.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-xl mx-auto relative"
          >
            <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
            <input
              type="text"
              placeholder="Search movies, directors, actors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-2xl backdrop-blur-xl transition-all"
            />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* Tabs */}
        {!searchQuery && (
          <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
            <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('now_showing')}
                className={`px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'now_showing' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Now Showing
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Coming Soon
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>🎞️</span>
              <span>{movies.length} Movies Found</span>
            </div>
          </div>
        )}

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-slate-900 h-96 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24 bg-slate-900/40 rounded-3xl border border-slate-800/60 max-w-2xl mx-auto">
            <p className="text-slate-400 font-medium text-lg mb-2">No blockbusters matched your criteria</p>
            <p className="text-slate-600 text-xs">Try typing a different movie title or check upcoming releases</p>
          </div>
        )}
      </div>
    </div>
  );
}
