// src/validators/schemas.js
import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const bookingSchema = Joi.object({
  showTimeId: Joi.string().required(),
  seats: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    seatNumber: Joi.string().required()
  })).min(1).required(),
  promoCode: Joi.string().allow('', null),
  specialRequests: Joi.string().allow('', null)
});
