// src/controllers/movie.controller.js
import Movie from '../models/Movie.js';
import ShowTime from '../models/ShowTime.js';
import Screen from '../models/Screen.js';
import Theater from '../models/Theater.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import { Op } from '../utils/sequelizeBridge.js';

export const getAllMovies = async (req, res) => {
  const { page = 1, limit = 20, status, genre, language } = req.query;
  const offset = (page - 1) * limit;

  try {
    const cacheKey = `movies:${status}:${genre}:${language}:${page}:${limit}`;
    const cachedData = await cacheGet(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const whereConditions = { isActive: true };

    if (status) {
      whereConditions.releaseStatus = status;
    }

    if (genre) {
      whereConditions.genre = {
        [Op.substring]: genre
      };
    }

    if (language) {
      whereConditions.language = {
        [Op.substring]: language
      };
    }

    const { count, rows } = await Movie.findAndCountAll({
      where: whereConditions,
      offset,
      limit: parseInt(limit),
      order: [['releaseDate', 'DESC']],
      attributes: {
        exclude: ['description']
      }
    });

    const response = {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    };

    await cacheSet(cacheKey, response, 3600);

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
};

export const searchMovies = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  try {
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Movie.findAndCountAll({
      where: {
        isActive: true,
        [Op.or]: [
          { title: { [Op.substring]: q } },
          { description: { [Op.substring]: q } },
          { director: { [Op.substring]: q } }
        ]
      },
      offset,
      limit: parseInt(limit),
      attributes: {
        exclude: ['description']
      }
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Search failed' });
  }
};

export const getMovieById = async (req, res) => {
  const { id } = req.params;

  try {
    const cacheKey = `movie:${id}`;
    const cachedMovie = await cacheGet(cacheKey);

    if (cachedMovie) {
      return res.json(cachedMovie);
    }

    const movie = await Movie.findByPk(id);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    await cacheSet(cacheKey, movie, 7200);

    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch movie' });
  }
};

export const getMovieShowtimes = async (req, res) => {
  const { id } = req.params;
  const { date, city } = req.query;

  try {
    const whereConditions = {
      movieId: id,
      isActive: true,
      isCancelled: false
    };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      whereConditions.startTime = {
        [Op.between]: [startDate, endDate]
      };
    }

    const showtimes = await ShowTime.findAll({
      where: whereConditions,
      include: [
        {
          model: Screen,
          attributes: ['id', 'name', 'screenType', 'theaterId'],
          include: [
            {
              model: Theater,
              attributes: ['id', 'name', 'city', 'area'],
              where: city ? { city } : undefined
            }
          ]
        }
      ],
      order: [['startTime', 'ASC']]
    });

    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch showtimes' });
  }
};
