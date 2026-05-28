// src/stores/bookingStore.js
import { create } from 'zustand';
import api from '../services/api.js';

const useBookingStore = create((set, get) => ({
  selectedShowtime: null,
  selectedSeats: [],
  lockedSeats: {},
  promoCode: null,
  discountAmount: 0,
  isLoading: false,
  error: null,
  currentBooking: null,

  setSelectedShowtime: (showtime) => set({ selectedShowtime: showtime, selectedSeats: [], promoCode: null, discountAmount: 0 }),
  
  toggleSeatSelection: (seat) => {
    const { selectedSeats } = get();
    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    const newSeats = isSelected
      ? selectedSeats.filter((s) => s.id !== seat.id)
      : [...selectedSeats, seat];
    set({ selectedSeats: newSeats, promoCode: null, discountAmount: 0 });
  },

  setLockedSeats: (locked) => set({ lockedSeats: locked }),

  applyPromoCode: async (code, totalAmount) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/bookings/validate-promo', {
        promoCode: code,
        totalAmount
      });
      set({ 
        promoCode: response.data.code, 
        discountAmount: response.data.discountAmount, 
        isLoading: false 
      });
      return { success: true, data: response.data };
    } catch (error) {
      set({ 
        promoCode: null, 
        discountAmount: 0, 
        error: error.response?.data?.message || 'Invalid promo code', 
        isLoading: false 
      });
      return { success: false, message: error.response?.data?.message || 'Invalid promo code' };
    }
  },

  createBooking: async (specialRequests = '') => {
    const { selectedShowtime, selectedSeats, promoCode } = get();
    if (!selectedShowtime || selectedSeats.length === 0) return null;

    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/bookings', {
        showTimeId: selectedShowtime.id,
        seats: selectedSeats.map(s => ({ id: s.id, seatNumber: s.seatNumber })),
        promoCode,
        specialRequests
      });
      set({ currentBooking: response.data.booking, isLoading: false });
      return response.data.booking;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Booking failed', isLoading: false });
      return null;
    }
  },

  clearBookingState: () => set({
    selectedShowtime: null,
    selectedSeats: [],
    promoCode: null,
    discountAmount: 0,
    error: null,
    currentBooking: null
  })
}));

export default useBookingStore;
