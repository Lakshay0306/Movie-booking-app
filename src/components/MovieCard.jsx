import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const MovieCard = ({ movie }) => {
  // Ensure genre is an array
  const genres = Array.isArray(movie.genre) 
    ? movie.genre 
    : (typeof movie.genre === 'string' ? movie.genre.split(',').map(g => g.trim()) : []);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl hover:border-amber-500/50 flex flex-col group"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
        <img
          src={movie.posterImage || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80'}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
        <span className="absolute top-4 right-4 bg-amber-500/90 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md uppercase">
          {movie.rating || 'UA'}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-1.5">
            <span>⭐</span>
            <span>{movie.imdbRating ? `${movie.imdbRating}/10` : '8.5/10'}</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-amber-400 transition-colors">
            {movie.title}
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {genres.map((g, index) => (
              <span key={index} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50">
                {g}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <span>⏱️</span>
            <span>{movie.duration ? `${movie.duration}m` : '140m'}</span>
          </div>
          <Link
            href={`/movie/${movie.id}`}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-[10px] font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            Book Tickets
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;
