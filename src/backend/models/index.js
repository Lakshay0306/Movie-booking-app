// src/models/index.js
import User from './User.js';
import Movie from './Movie.js';
import Theater from './Theater.js';
import Screen from './Screen.js';
import Seat from './Seat.js';
import ShowTime from './ShowTime.js';
import Booking from './Booking.js';
import Payment from './Payment.js';
import SeatLock from './SeatLock.js';
import PromoCode from './PromoCode.js';

// Dummy setupAssociations for compatibility with original code
export const setupAssociations = () => {
  // Model associations are defined using mongoose refs and virtual populates
};

export {
  User,
  Movie,
  Theater,
  Screen,
  Seat,
  ShowTime,
  Booking,
  Payment,
  SeatLock,
  PromoCode
};
