// src/seeds/index.js
import { setupAssociations } from '../models/index.js';
import { initializeDatabase } from '../config/database.js';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Theater from '../models/Theater.js';
import Screen from '../models/Screen.js';
import Seat from '../models/Seat.js';
import ShowTime from '../models/ShowTime.js';
import PromoCode from '../models/PromoCode.js';
import { logger } from '../utils/logger.js';

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');
    setupAssociations();
    await initializeDatabase();

    // Clear existing showtimes to ensure the seeded showtime is always in the future
    await ShowTime.deleteMany({});
    logger.info('Cleared existing showtimes.');

    // 1. Seed Admin User
    const [adminUser] = await User.findOrCreate({
      where: { email: 'admin@cineverse.com' },
      defaults: {
        firstName: 'System',
        lastName: 'Admin',
        phone: '9999999999',
        password: 'Password@123',
        role: 'admin',
        isEmailVerified: true,
        isActive: true
      }
    });
    logger.info(`Admin user seeded: ${adminUser.email}`);

    // 2. Seed Movies
    const [movie1] = await Movie.findOrCreate({
      where: { title: 'Inception (Re-Release)' },
      defaults: {
        description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        genre: ['Action', 'Sci-Fi', 'Thriller'],
        language: ['English', 'Hindi'],
        releaseDate: new Date(),
        duration: 148,
        rating: 'UA',
        imdbRating: 8.8,
        posterImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        bannerImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
        director: 'Christopher Nolan',
        releaseStatus: 'now_showing'
      }
    });

    const [movie2] = await Movie.findOrCreate({
      where: { title: 'Interstellar - IMAX Experience' },
      defaults: {
        description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        genre: ['Sci-Fi', 'Adventure', 'Drama'],
        language: ['English'],
        releaseDate: new Date(Date.now() + 86400000 * 5),
        duration: 169,
        rating: 'U',
        imdbRating: 8.7,
        posterImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80',
        bannerImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        director: 'Christopher Nolan',
        releaseStatus: 'upcoming'
      }
    });
    logger.info('Sample blockbusters seeded.');

    // 3. Seed Theater & Screen
    const [theater] = await Theater.findOrCreate({
      where: { name: 'CineVerse Premium Multiplex' },
      defaults: {
        city: 'Mumbai',
        area: 'Bandra West',
        address: 'Level 4, High Street Mall, Bandra West, Mumbai',
        phone: '022-55558888',
        email: 'help@cineverse.com'
      }
    });

    const [screen] = await Screen.findOrCreate({
      where: { name: 'AUDI 1 - Dolby Atmos' },
      defaults: {
        theaterId: theater.id,
        screenType: 'IMAX',
        totalSeats: 40,
        rows: 4,
        seatsPerRow: 10
      }
    });
    logger.info('Theater and Screen configured.');

    // 4. Seed Seats
    const seatCount = await Seat.count({ where: { screenId: screen.id } });
    if (seatCount === 0) {
      const seatsToInsert = [];
      const rowsLabels = ['A', 'B', 'C', 'D'];
      for (let r = 0; r < rowsLabels.length; r++) {
        const rowLabel = rowsLabels[r];
        const seatType = r === 3 ? 'recliners' : r === 2 ? 'premium' : 'standard';
        for (let col = 1; col <= 10; col++) {
          seatsToInsert.push({
            screenId: screen.id,
            seatNumber: `${rowLabel}${col}`,
            row: rowLabel,
            column: col,
            seatType
          });
        }
      }
      await Seat.bulkCreate(seatsToInsert);
      logger.info(`Inserted 40 seats for ${screen.name}`);
    }

    // 5. Seed ShowTime
    const [showtime] = await ShowTime.findOrCreate({
      where: { movieId: movie1.id, screenId: screen.id },
      defaults: {
        startTime: new Date(Date.now() + 3600000 * 3), // 3 hours from now
        endTime: new Date(Date.now() + 3600000 * 6),
        priceStandard: 250.00,
        pricePremium: 400.00,
        priceRecliners: 600.00,
        totalSeats: 40,
        bookedSeats: 0
      }
    });
    logger.info(`Showtime seeded for movie: ${movie1.title}`);

    // 6. Seed PromoCode
    await PromoCode.findOrCreate({
      where: { code: 'WELCOME50' },
      defaults: {
        discountType: 'percentage',
        discountValue: 50.00,
        maxDiscount: 200.00,
        minBookingAmount: 300.00,
        validFrom: new Date(),
        validUpto: new Date(Date.now() + 86400000 * 30)
      }
    });
    logger.info('Promo code WELCOME50 configured.');

    logger.info('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
