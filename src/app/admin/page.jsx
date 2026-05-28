// src/app/admin/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api.js';
import useAuthStore from '@/stores/authStore';

export default function AdminDashboard() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [showTheaterModal, setShowTheaterModal] = useState(false);
  const [showScreenModal, setShowScreenModal] = useState(null); // Will hold theater object
  const [showtimeModalMovie, setShowtimeModalMovie] = useState(null);

  // Forms state
  const [newMovie, setNewMovie] = useState({ 
    title: '', duration: 120, releaseStatus: 'now_showing', rating: 'UA',
    posterImage: '', bannerImage: '', imdbRating: 8.0, genre: 'Action, Drama',
    language: 'Hindi', cast: '', director: '', description: ''
  });

  const [newTheater, setNewTheater] = useState({
    name: '', city: 'Mumbai', area: '', address: '', phone: '', email: ''
  });

  const [newScreen, setNewScreen] = useState({
    name: '', screenType: 'IMAX', rows: 10, seatsPerRow: 15
  });

  const [newShowtime, setNewShowtime] = useState({
    screenId: '', startTime: '', priceStandard: 250, pricePremium: 450, priceRecliners: 650
  });

  const fetchData = async () => {
    try {
      const [statsRes, moviesRes, theatersRes, showtimesRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/movies'),
        api.get('/theaters'),
        api.get('/admin/showtimes')
      ]);
      setStats(statsRes.data);
      setMovies(moviesRes.data?.data || moviesRes.data || []);
      
      // Ensure all screens are mapped correctly to both camelCase Screens and database schema naming
      const mappedTheaters = (theatersRes.data || []).map(t => ({
        ...t,
        Screens: t.Screens || t.Screen || t.screens || []
      }));
      setTheaters(mappedTheaters);
      
      setShowtimes(showtimesRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for store to hydrate from localStorage
    
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchData();
  }, [_hasHydrated, user, router]);

  const handleCreateMovie = async (e) => {
    e.preventDefault();
    try {
      const formattedMovie = {
        ...newMovie,
        genre: newMovie.genre.split(',').map(g => g.trim()).filter(Boolean),
        language: newMovie.language.split(',').map(l => l.trim()).filter(Boolean),
        cast: newMovie.cast ? newMovie.cast.split(',').map(c => c.trim()).filter(Boolean) : []
      };
      await api.post('/admin/movies', formattedMovie);
      alert('Movie added!');
      setShowMovieModal(false);
      setNewMovie({ 
        title: '', duration: 120, releaseStatus: 'now_showing', rating: 'UA',
        posterImage: '', bannerImage: '', imdbRating: 8.0, genre: 'Action, Drama',
        language: 'Hindi', cast: '', director: '', description: ''
      });
      fetchData();
    } catch (err) { 
      console.error(err);
      alert('Failed to add movie.'); 
    }
  };

  const handleCreateTheater = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/theaters', newTheater);
      alert('Theater added!');
      setShowTheaterModal(false);
      setNewTheater({
        name: '', city: 'Mumbai', area: '', address: '', phone: '', email: ''
      });
      fetchData();
    } catch (err) { 
      console.error(err);
      alert('Failed to add theater.'); 
    }
  };

  const handleCreateScreen = async (e) => {
    e.preventDefault();
    const theaterId = showScreenModal.id || showScreenModal._id;
    try {
      await api.post('/admin/screens', { ...newScreen, theaterId });
      alert('Screen added to ' + showScreenModal.name);
      setShowScreenModal(null);
      setNewScreen({
        name: '', screenType: 'IMAX', rows: 10, seatsPerRow: 15
      });
      fetchData(); // Refresh to show nested screens
    } catch (err) { 
      console.error(err);
      alert('Failed to add screen.'); 
    }
  };

  const handleCreateShowtime = async (e) => {
    e.preventDefault();
    const movieId = showtimeModalMovie.id || showtimeModalMovie._id;
    try {
      await api.post(`/admin/movies/${movieId}/showtimes`, newShowtime);
      alert('Showtime created!');
      setShowtimeModalMovie(null);
      setNewShowtime({
        screenId: '', startTime: '', priceStandard: 250, pricePremium: 450, priceRecliners: 650
      });
      fetchData();
    } catch (err) { 
      console.error(err);
      alert('Failed to create showtime.'); 
    }
  };

  if (!_hasHydrated || loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Master Panel...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black">Master Admin Desk</h1>
            <p className="text-xs text-slate-400">Manage Movies, Theaters and Shows</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTheaterModal(true)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl">
              + Add Theater
            </button>
            <button onClick={() => setShowMovieModal(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl">
              + Add Movie
            </button>
          </div>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 text-center">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-amber-500 text-[10px] font-bold uppercase">Movies</div>
              <div className="text-xl font-black">{stats.totalMovies}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-amber-500 text-[10px] font-bold uppercase">Revenue</div>
              <div className="text-xl font-black">₹{stats.totalRevenue}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-amber-500 text-[10px] font-bold uppercase">Theaters</div>
              <div className="text-xl font-black">{theaters.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-amber-500 text-[10px] font-bold uppercase">Active Shows</div>
              <div className="text-xl font-black">{showtimes.length}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Movies Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 font-bold text-sm bg-slate-950/50">Movie Inventory</div>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-800">
                  {movies.map(m => (
                    <tr key={m.id || m._id} className="hover:bg-slate-800/30">
                      <td className="p-4 flex items-center gap-3">
                        <img src={m.posterImage} alt="" className="w-8 h-10 object-cover rounded bg-slate-950" />
                        <div className="font-bold">{m.title}</div>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setShowtimeModalMovie(m)} className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-1 rounded border border-amber-500/20">Assign Show</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Theaters Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 font-bold text-sm bg-slate-950/50">Theaters & Screens</div>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-800">
                  {theaters.map(t => (
                    <tr key={t.id || t._id} className="hover:bg-slate-800/30">
                      <td className="p-4">
                        <div className="font-bold">{t.name}</div>
                        <div className="text-slate-500 text-[10px]">{t.city} • {t.Screens?.length || 0} Screens</div>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setShowScreenModal(t)} className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-1 rounded border border-emerald-500/20">+ Add Screen</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Showtimes Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mt-8">
          <div className="p-4 border-b border-slate-800 font-bold text-sm bg-slate-950/50">Current Show Schedule</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-500 uppercase">
                <tr>
                  <th className="p-4">Movie</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Time</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {showtimes.map(s => (
                  <tr key={s.id || s._id}>
                    <td className="p-4 font-bold">{s.Movie?.title}</td>
                    <td className="p-4 text-slate-400">{s.Screen?.Theater?.name} ({s.Screen?.name})</td>
                    <td className="p-4 text-amber-500">{new Date(s.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="p-4 text-right">
                      <button onClick={async () => { if(confirm('Cancel?')) { await api.delete(`/admin/showtimes/${s.id || s._id}`); fetchData(); } }} className="text-rose-500">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Theater Modal */}
      {showTheaterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black mb-6">Add New Theater</h2>
            <form onSubmit={handleCreateTheater} className="space-y-4">
              <input required type="text" placeholder="Theater Name" value={newTheater.name} onChange={e => setNewTheater({...newTheater, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <input required type="text" placeholder="City" value={newTheater.city} onChange={e => setNewTheater({...newTheater, city: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <input type="text" placeholder="Address" value={newTheater.address} onChange={e => setNewTheater({...newTheater, address: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-amber-500 text-slate-950 font-black py-3 rounded-xl">Save Theater</button>
                <button type="button" onClick={() => setShowTheaterModal(false)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screen Modal */}
      {showScreenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black mb-6">Add Screen to {showScreenModal.name}</h2>
            <form onSubmit={handleCreateScreen} className="space-y-4">
              <input required type="text" placeholder="Screen Name (e.g. Audi 1)" value={newScreen.name} onChange={e => setNewScreen({...newScreen, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <select value={newScreen.screenType} onChange={e => setNewScreen({...newScreen, screenType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs">
                <option value="Standard">Standard</option>
                <option value="IMAX">IMAX</option>
                <option value="4DX">4DX</option>
                <option value="Dolby Atmos">Dolby Atmos</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Rows" value={newScreen.rows} onChange={e => setNewScreen({...newScreen, rows: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
                <input type="number" placeholder="Seats Per Row" value={newScreen.seatsPerRow} onChange={e => setNewScreen({...newScreen, seatsPerRow: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-emerald-500 text-slate-950 font-black py-3 rounded-xl">Add Screen</button>
                <button type="button" onClick={() => setShowScreenModal(null)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Showtime Modal */}
      {showtimeModalMovie && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-black mb-6">Publish Show: {showtimeModalMovie.title}</h2>
            <form onSubmit={handleCreateShowtime} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Select Theater & Screen</label>
                <select required value={newShowtime.screenId} onChange={e => setNewShowtime({...newShowtime, screenId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs">
                  <option value="">-- Choose --</option>
                  {theaters.map(t => {
                    const screens = t.Screens || t.screen || t.Screen || t.screens || [];
                    return (
                      <optgroup key={t.id || t._id} label={t.name}>
                        {screens.map(s => (
                          <option key={s.id || s._id} value={s.id || s._id}>
                            {s.name} ({s.screenType})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Show Time</label>
                <input required type="datetime-local" value={newShowtime.startTime} onChange={e => setNewShowtime({...newShowtime, startTime: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Std ₹" value={newShowtime.priceStandard} onChange={e => setNewShowtime({...newShowtime, priceStandard: parseInt(e.target.value)})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
                <input type="number" placeholder="Pre ₹" value={newShowtime.pricePremium} onChange={e => setNewShowtime({...newShowtime, pricePremium: parseInt(e.target.value)})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
                <input type="number" placeholder="Rec ₹" value={newShowtime.priceRecliners} onChange={e => setNewShowtime({...newShowtime, priceRecliners: parseInt(e.target.value)})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              </div>
              <div className="flex gap-4 mt-4">
                <button type="submit" className="flex-1 bg-amber-500 text-slate-950 font-black py-3 rounded-xl">Publish Show</button>
                <button type="button" onClick={() => setShowtimeModalMovie(null)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Movie Modal */}
      {showMovieModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-black mb-6">Add Global Movie Record</h2>
            <form onSubmit={handleCreateMovie} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <input required type="text" placeholder="Movie Title" value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              </div>
              <input type="text" placeholder="Poster URL" value={newMovie.posterImage} onChange={e => setNewMovie({...newMovie, posterImage: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <input type="text" placeholder="Banner URL (Optional)" value={newMovie.bannerImage} onChange={e => setNewMovie({...newMovie, bannerImage: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <input type="text" placeholder="Genre (comma separated)" value={newMovie.genre} onChange={e => setNewMovie({...newMovie, genre: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <input type="text" placeholder="Language (comma separated)" value={newMovie.language} onChange={e => setNewMovie({...newMovie, language: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <input type="number" placeholder="Duration (min)" value={newMovie.duration} onChange={e => setNewMovie({...newMovie, duration: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <input type="number" step="0.1" placeholder="IMDB Rating" value={newMovie.imdbRating} onChange={e => setNewMovie({...newMovie, imdbRating: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <input type="text" placeholder="Director" value={newMovie.director} onChange={e => setNewMovie({...newMovie, director: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              <input type="text" placeholder="Cast (comma separated)" value={newMovie.cast} onChange={e => setNewMovie({...newMovie, cast: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs" />
              
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Release Status</label>
                <select value={newMovie.releaseStatus} onChange={e => setNewMovie({...newMovie, releaseStatus: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs">
                  <option value="now_showing">Now Showing</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Rating</label>
                <select value={newMovie.rating} onChange={e => setNewMovie({...newMovie, rating: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs">
                  <option value="U">U</option>
                  <option value="UA">UA</option>
                  <option value="A">A</option>
                  <option value="R">R</option>
                </select>
              </div>

              <div className="col-span-2">
                <textarea placeholder="Description" value={newMovie.description || ''} onChange={e => setNewMovie({...newMovie, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs h-20 resize-none" />
              </div>

              <div className="col-span-2 flex gap-4 mt-4">
                <button type="submit" className="flex-1 bg-amber-500 text-slate-950 font-black py-3 rounded-xl">Save Movie</button>
                <button type="button" onClick={() => setShowMovieModal(false)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
