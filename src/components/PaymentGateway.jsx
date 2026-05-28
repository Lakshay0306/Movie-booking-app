// src/components/PaymentGateway.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api.js';
import { CreditCard, CheckCircle2 } from 'lucide-react';

const PaymentGateway = ({ booking, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [error, setError] = useState(null);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      if (paymentMethod === 'stripe') {
        // Direct integration via backend for premium simulation
        const intentRes = await api.post('/payments/stripe/create-intent', { bookingId: booking.id });
        const confirmRes = await api.post('/payments/stripe/confirm', {
          bookingId: booking.id,
          paymentIntentId: intentRes.data.paymentIntentId || `mock_intent_${Date.now()}`
        });
        onSuccess(confirmRes.data);
      } else {
        // REAL RAZORPAY INTEGRATION
        const res = await loadRazorpay();
        if (!res) {
          setError('Razorpay SDK failed to load. Are you online?');
          setLoading(false);
          return;
        }

        const orderRes = await api.post('/payments/razorpay/create-order', { bookingId: booking.id });
        const { amount, currency, orderId, isMock } = orderRes.data;

        if (isMock) {
          console.log('Simulating Razorpay payment success locally');
          const verifyRes = await api.post('/payments/razorpay/verify', {
            bookingId: booking.id,
            razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substring(7),
            razorpayOrderId: orderId,
            razorpaySignature: 'sig_mock_dummy'
          });
          onSuccess(verifyRes.data);
          return;
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || process.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder',
          amount: amount,
          currency: currency,
          name: 'CineVerse Tickets',
          description: `Booking for ${booking.bookingReference}`,
          order_id: orderId,
          handler: async (response) => {
            try {
              const verifyRes = await api.post('/payments/razorpay/verify', {
                bookingId: booking.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });
              onSuccess(verifyRes.data);
            } catch (err) {
              setError('Payment verification failed');
              setLoading(false);
            }
          },
          prefill: {
            name: 'Customer Name',
            email: 'customer@example.com',
            contact: '9999999999',
          },
          theme: {
            color: '#F59E0B', // Amber 500
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 p-6 md:p-8 rounded-3xl max-w-md mx-auto shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-amber-500" />
        <span>Secure Checkout</span>
      </h3>

      <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 mb-6">
        <div className="flex justify-between text-sm mb-2 text-slate-400">
          <span>Booking Reference</span>
          <span className="font-bold text-white">{booking.bookingReference}</span>
        </div>
        <div className="flex justify-between text-base font-extrabold text-amber-400 pt-2 border-t border-slate-800/60">
          <span>Total Amount</span>
          <span>₹{booking.finalAmount}</span>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <label 
          onClick={() => setPaymentMethod('stripe')}
          className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'stripe' ? 'bg-amber-500/10 border-amber-500 text-white font-bold' : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'stripe' ? 'border-amber-500 bg-amber-500' : 'border-slate-600'}`}>
              {paymentMethod === 'stripe' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
            </div>
            <span>Credit/Debit Card (Stripe)</span>
          </div>
          <CreditCard className="w-4 h-4 text-slate-500" />
        </label>

        <label 
          onClick={() => setPaymentMethod('razorpay')}
          className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'bg-amber-500/10 border-amber-500 text-white font-bold' : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-amber-500 bg-amber-500' : 'border-slate-600'}`}>
              {paymentMethod === 'razorpay' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
            </div>
            <span>NetBanking / UPI (Razorpay)</span>
          </div>
          <span className="text-xs uppercase font-extrabold bg-slate-800 px-2 py-0.5 rounded text-amber-500">Popular</span>
        </label>
      </div>

      {error && <div className="p-3 mb-4 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-900/40 text-xs font-semibold">{error}</div>}

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-4 rounded-xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Pay ₹{booking.finalAmount} Now</span>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default PaymentGateway;
