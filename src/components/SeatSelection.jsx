// src/components/SeatSelection.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useBookingStore from '../stores/bookingStore.js';
import { createSeatsSocket } from '../services/socket.js';
import api from '../services/api.js';

const SeatSelection = ({ showTimeId }) => {
  const [seatsData, setSeatsData] = useState([]);
  const [screenData, setScreenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedSeats, toggleSeatSelection, lockedSeats, setLockedSeats } = useBookingStore();

  useEffect(() => {
    let socket;
    const fetchSeats = async () => {
      try {
        const response = await api.get(`/seats/showtime/${showTimeId}`);
        setSeatsData(response.data.seats);
        setScreenData(response.data.screen);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchSeats();

    socket = createSeatsSocket();
    socket.connect();

    socket.emit('join-showtime', showTimeId);

    socket.on('seats-locked', ({ seats, userId }) => {
      setLockedSeats((prev) => {
        const next = { ...prev };
        seats.forEach((s) => { next[s] = userId; });
        return next;
      });
    });

    socket.on('seats-unlocked', ({ seats }) => {
      setLockedSeats((prev) => {
        const next = { ...prev };
        seats.forEach((s) => { delete next[s]; });
        return next;
      });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [showTimeId]);

  const handleSeatClick = (seat) => {
    if (seat.status === 'booked' || lockedSeats[seat.id]) return;
    toggleSeatSelection(seat);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400 font-medium animate-pulse">Loading seating arrangement...</div>;
  }

  // Organize seats by rows
  const rows = {};
  seatsData.forEach((seat) => {
    if (!rows[seat.row]) rows[seat.row] = [];
    rows[seat.row].push(seat);
  });

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
      {/* Screen Curved Representation */}
      <div className="mb-12 text-center">
        <div className="w-4/5 mx-auto h-2 bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20 rounded-full shadow-[0_4px_20px_rgba(251,191,36,0.3)]" />
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-3">All Eyes This Way</p>
      </div>

      {/* Seat Matrix */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[600px] flex flex-col gap-3">
          {Object.keys(rows).sort().map((rowLabel) => (
            <div key={rowLabel} className="flex items-center gap-4">
              <span className="w-6 text-sm font-bold text-amber-500 text-center">{rowLabel}</span>
              <div className="flex-1 flex gap-2 justify-center">
                {rows[rowLabel].sort((a, b) => a.column - b.column).map((seat) => {
                  const isSelected = selectedSeats.some((s) => s.id === seat.id);
                  const isLocked = lockedSeats[seat.id];
                  const isBooked = seat.status === 'booked';

                  let seatBg = 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700/50';
                  if (isBooked) seatBg = 'bg-rose-950/40 text-rose-800 border-rose-900/30 cursor-not-allowed';
                  else if (isLocked) seatBg = 'bg-amber-950/40 text-amber-700 border-amber-900/30 cursor-not-allowed';
                  else if (isSelected) seatBg = 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold border-amber-400 shadow-lg shadow-amber-500/20 scale-110';

                  return (
                    <motion.button
                      key={seat.id}
                      whileTap={!isBooked && !isLocked ? { scale: 0.9 } : {}}
                      onClick={() => handleSeatClick(seat)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs transition-all ${seatBg}`}
                    >
                      {seat.column}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 pt-6 border-t border-slate-800 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-slate-800 border border-slate-700" />
          <span className="text-slate-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-amber-500 to-amber-600 shadow-sm shadow-amber-500/20" />
          <span className="text-white">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-amber-950/40 border border-amber-900/30" />
          <span className="text-amber-600">Locked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-rose-950/40 border border-rose-900/30" />
          <span className="text-rose-700">Sold</span>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
