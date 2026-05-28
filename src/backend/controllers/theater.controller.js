// src/controllers/theater.controller.js
import Theater from '../models/Theater.js';
import Screen from '../models/Screen.js';
import { cacheGet, cacheSet } from '../config/redis.js';

export const getAllTheaters = async (req, res) => {
  const { city } = req.query;

  try {
    const cacheKey = `theaters:${city || 'all'}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const where = { isActive: true };
    if (city) where.city = city;

    const theaters = await Theater.findAll({
      where,
      include: [{ model: Screen, attributes: ['id', 'name', 'screenType', 'theaterId'] }]
    });

    await cacheSet(cacheKey, theaters, 3600);
    res.json(theaters);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch theaters' });
  }
};

export const getTheaterById = async (req, res) => {
  try {
    const theater = await Theater.findByPk(req.params.id, {
      include: [Screen]
    });

    if (!theater) return res.status(404).json({ message: 'Theater not found' });
    res.json(theater);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch theater' });
  }
};
