// src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = (typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')).replace('/api', '');

export const createSeatsSocket = () => {
  let token = null;
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      token = state?.accessToken;
    }
  } catch (err) {}

  return io(`${SOCKET_URL}/seats`, {
    auth: { token },
    withCredentials: true,
    autoConnect: false
  });
};

export const createNotificationsSocket = () => {
  let token = null;
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      token = state?.accessToken;
    }
  } catch (err) {}

  return io(`${SOCKET_URL}/notifications`, {
    auth: { token },
    withCredentials: true,
    autoConnect: false
  });
};
