// src/app/profile/page.jsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api.js';
import useAuthStore from '@/stores/authStore.js';
import { User, Phone, Mail, Award, Film, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for store to hydrate from localStorage

    if (!user) {
      router.push('/login');
      return;
    }
    setFormData({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' });

    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings');
        setBookings(response.data.data || []);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user, _hasHydrated, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', formData);
      updateUser(res.data.user);
      setEditing(false);
      alert('Profile updated successfully');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Details Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit shadow-xl">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-slate-950 font-black text-2xl mx-auto mb-4 shadow-lg shadow-amber-500/10">
            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-center text-white">{user.firstName} {user.lastName}</h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-500 font-bold mt-1 mb-6">
            <Award className="w-3.5 h-3.5" />
            <span className="uppercase">{user.role} Member</span>
          </div>

          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-3 text-left">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-500 text-slate-950 font-bold text-xs py-2 rounded-xl">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="flex-1 bg-slate-800 text-slate-400 font-bold text-xs py-2 rounded-xl">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/60 text-xs mb-6">
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-white line-clamp-1">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-white">{user.phone || 'N/A'}</span>
              </div>
            </div>
          )}

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all mb-3"
            >
              Edit Profile Details
            </button>
          )}

          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full bg-rose-950/30 hover:bg-rose-950/50 text-rose-400 border border-rose-900/40 font-bold py-2.5 rounded-xl text-xs transition-all"
          >
            Log Out Securely
          </button>
        </div>

        {/* Booking History */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Film className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl font-bold text-white">Your Booking Vault</h3>
          </div>

          {loading ? (
            <div className="h-40 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
          ) : bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map(b => (
                <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-amber-500">{b.bookingReference}</span>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/40">
                        {b.bookingStatus}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white">{b.ShowTime?.Movie?.title || 'CineVerse Screening'}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(b.ShowTime?.startTime || Date.now()).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Seats: <strong className="text-slate-200">{b.seats?.map(s => s.seatNumber).join(', ')}</strong>
                    </p>
                  </div>

                  <div className="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <span className="text-sm font-black text-amber-400 block">₹{b.finalAmount}</span>
                    {b.ticketPdfUrl ? (
                      <a href={b.ticketPdfUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg shadow-sm">
                        View e-Ticket
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-500 block mt-1">Encrypted eTicket PDF Setup</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
              <p className="text-slate-400 font-medium text-sm">No ticket bookings logged yet</p>
              <button onClick={() => router.push('/')} className="mt-3 text-xs font-bold text-amber-500 hover:underline">Explore Blockbusters Now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
