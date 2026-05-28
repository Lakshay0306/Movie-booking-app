// src/controllers/showtime.controller.js
import ShowTime from '../models/ShowTime.js';
import Movie from '../models/Movie.js';
import Screen from '../models/Screen.js';
import Theater from '../models/Theater.js';

export const getShowtimeById = async (req, res) => {
  try {
    const showtime = await ShowTime.findByPk(req.params.id, {
      include: [
        Movie,
        { model: Screen, include: [Theater] }
      ]
    });

    if (!showtime) return res.status(404).json({ message: 'Showtime not found' });
    res.json(showtime);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch showtime' });
  }
};
