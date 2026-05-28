// src/app/movie/[id]/page.jsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api.js';
import useBookingStore from '@/stores/bookingStore.js';
import useAuthStore from '@/stores/authStore.js';
import SeatSelection from '@/components/SeatSelection.jsx';
import PaymentGateway from '@/components/PaymentGateway.jsx';
import { Calendar, MapPin, ChevronRight, CheckCircle, Ticket } from 'lucide-react';

export default function BookingPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const {
    selectedShowtime,
    setSelectedShowtime,
    selectedSeats,
    promoCode,
    discountAmount,
    applyPromoCode,
    createBooking,
    clearBookingState,
    error: bookingError,
    isLoading: isBookingLoading
  } = useBookingStore();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('showtimes'); // showtimes -> seats -> payment -> success
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState(null);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [ticketUrl, setTicketUrl] = useState(null);

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for store to hydrate from localStorage

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchDetails = async () => {
      try {
        const [movieRes, showtimesRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get(`/movies/${id}/showtimes`)
        ]);
        setMovie(movieRes.data);
        setShowtimes(showtimesRes.data || []);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchDetails();

    return () => clearBookingState();
  }, [id, isAuthenticated, _hasHydrated, router]);

  const handleShowtimeSelect = (st) => {
    setSelectedShowtime(st);
    setStep('seats');
  };

  const handleApplyPromo = async () => {
    setPromoError(null);
    setPromoSuccess(false);
    if (!promoInput) return;

    const result = await applyPromoCode(promoInput, baseTotal);
    if (result.success) setPromoSuccess(true);
    else setPromoError(result.message || 'Invalid promo code');
  };

  const handleProceedToPayment = async () => {
    const booking = await createBooking(specialRequests);
    if (booking) {
      setBookingResult(booking);
      setStep('payment');
    }
  };

  const handlePaymentSuccess = async (result) => {
    try {
      const ticketRes = await api.get(`/bookings/${bookingResult.id}/ticket`);
      setTicketUrl(ticketRes.data.ticketUrl);
    } catch (err) {}
    setStep('success');
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 pt-32 text-center text-slate-400 font-bold">Loading booking experience...</div>;
  }

  if (!movie) {
    return <div className="min-h-screen bg-slate-950 pt-32 text-center text-rose-500 font-bold">Movie not found</div>;
  }

  // Calculate pricing breakdown
  let baseTotal = 0;
  selectedSeats.forEach((seat) => {
    if (seat.seatType === 'premium') baseTotal += parseFloat(selectedShowtime?.pricePremium || 0);
    else if (seat.seatType === 'recliners') baseTotal += parseFloat(selectedShowtime?.priceRecliners || 0);
    else baseTotal += parseFloat(selectedShowtime?.priceStandard || 0);
  });
  const discount = promoSuccess ? discountAmount : 0;
  const finalTotal = baseTotal - discount;

  // Group showtimes by date
  const groupedShowtimes = {};
  showtimes.forEach((st) => {
    const dateStr = new Date(st.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!groupedShowtimes[dateStr]) groupedShowtimes[dateStr] = [];
    groupedShowtimes[dateStr].push(st);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-24">
      {/* Dynamic Header */}
      <div className="bg-slate-900 border-b border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-amber-500 font-bold text-xs uppercase tracking-widest">{movie.releaseStatus === 'upcoming' ? 'Advance Booking' : 'Now Booking'}</span>
            <h1 className="text-3xl font-extrabold text-white mt-1">{movie.title}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
              <span>{movie.duration} Mins</span>
              <span>•</span>
              <span className="uppercase font-semibold text-slate-300">{movie.rating}</span>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className={`px-3 py-1.5 rounded-lg ${step === 'showtimes' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>1. Shows</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className={`px-3 py-1.5 rounded-lg ${step === 'seats' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>2. Seats</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className={`px-3 py-1.5 rounded-lg ${step === 'payment' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>3. Pay</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10">
        <AnimatePresence mode="wait">
          {step === 'showtimes' && (
            <motion.div
              key="showtimes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <span>Select Showtime & Theater</span>
              </h2>

              {Object.keys(groupedShowtimes).length > 0 ? (
                <div className="space-y-8">
                  {Object.keys(groupedShowtimes).map((dateLabel) => (
                    <div key={dateLabel} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-amber-400 font-extrabold text-sm mb-6 border-b border-slate-800 pb-3">{dateLabel}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groupedShowtimes[dateLabel].map((st) => (
                          <div key={st.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all">
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2 text-white font-bold text-base">
                                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <span>{st.Screen?.Theater?.name || 'CineVerse Theater'}</span>
                                </div>
                                <span className="bg-slate-900 text-slate-300 font-extrabold text-xs px-2.5 py-1 rounded border border-slate-800">
                                  {st.Screen?.screenType || '2D'}
                                </span>
                              </div>
                              <p className="text-slate-500 text-xs pl-6 mb-4">{st.Screen?.Theater?.address || 'Premium Level, Metro Hub'}</p>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                              <span className="text-lg font-black text-amber-400">
                                {new Date(st.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button
                                onClick={() => handleShowtimeSelect(st)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-amber-500/10"
                              >
                                Select Shows
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 font-medium">No active showtimes scheduled for this movie</p>
                </div>
              )}
            </motion.div>
          )}

          {step === 'seats' && selectedShowtime && (
            <motion.div
              key="seats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Seating Arrangement Left */}
              <div className="lg:col-span-2">
                <SeatSelection showTimeId={selectedShowtime.id} />
              </div>

              {/* Order Sidebar Right */}
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <h3 className="font-bold text-base text-white mb-4 border-b border-slate-800 pb-3">Booking Summary</h3>
                  
                  <div className="space-y-3 text-xs mb-6">
                    <div className="flex justify-between text-slate-400">
                      <span>Screen / Aud.</span>
                      <span className="font-bold text-white">{selectedShowtime.Screen?.name} ({selectedShowtime.Screen?.screenType})</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Time</span>
                      <span className="font-bold text-white">{new Date(selectedShowtime.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Seats Selected</span>
                      <span className="font-bold text-amber-400">{selectedSeats.length > 0 ? selectedSeats.map(s => s.seatNumber).join(', ') : 'None'}</span>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  {selectedSeats.length > 0 && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60 space-y-2 mb-6">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Tickets Base ({selectedSeats.length})</span>
                        <span>₹{baseTotal}</span>
                      </div>
                      {promoSuccess && (
                        <div className="flex justify-between text-xs text-emerald-400">
                          <span>Promo Discount</span>
                          <span>- ₹{discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black text-amber-400 pt-2 border-t border-slate-900">
                        <span>Grand Total</span>
                        <span>₹{finalTotal}</span>
                      </div>
                    </div>
                  )}

                  {/* Promo Section */}
                  {selectedSeats.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-400 mb-2">Have a coupon code?</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="WELCOME50 / FLAT50"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs uppercase text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={handleApplyPromo}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all"
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && <p className="text-rose-500 text-[10px] font-semibold mt-1">{promoError}</p>}
                      {promoSuccess && <p className="text-emerald-400 text-[10px] font-semibold mt-1">Promo code applied successfully!</p>}
                    </div>
                  )}

                  {/* Special Requests */}
                  {selectedSeats.length > 0 && (
                    <div className="mb-6">
                      <textarea
                        placeholder="Add special requirements (e.g. wheelchair support, allergy notices)..."
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none h-20"
                      />
                    </div>
                  )}

                  {/* Error Display */}
                  {bookingError && (
                    <div className="p-3 mb-4 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-900/40 text-xs font-semibold text-center">
                      {bookingError}
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={handleProceedToPayment}
                    disabled={selectedSeats.length === 0 || isBookingLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-40 transition-all text-xs flex items-center justify-center gap-1"
                  >
                    {isBookingLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Proceed To Secure Pay</span>
                        <ChevronRight className="w-4 h-4 stroke-[3]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'payment' && bookingResult && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <PaymentGateway booking={bookingResult} onSuccess={handlePaymentSuccess} />
            </motion.div>
          )}

          {step === 'success' && bookingResult && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                <CheckCircle className="w-8 h-8 text-emerald-400 stroke-[2.5]" />
              </div>

              <h3 className="text-2xl font-black text-white mb-2">Booking Verified!</h3>
              <p className="text-slate-400 text-xs mb-6">Your ticket has been fully processed and locked securely.</p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-left space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Ref ID</span>
                  <span className="font-mono font-bold text-amber-400">{bookingResult.bookingReference}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Movie</span>
                  <span className="font-bold text-white line-clamp-1">{movie.title}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Seats</span>
                  <span className="font-bold text-white">{bookingResult.seats?.map(s => s.seatNumber).join(', ')}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {ticketUrl ? (
                  <a
                    href={ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Ticket className="w-4 h-4 stroke-[2.5]" />
                    <span>Download e-Ticket PDF</span>
                  </a>
                ) : (
                  <div className="text-xs text-amber-500/80 font-bold py-2 animate-pulse">Generating your live encrypted ticket...</div>
                )}

                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl text-xs transition-all"
                >
                  Back To Movie List
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
