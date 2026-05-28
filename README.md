# 🎬 CineVerse — Premium Movie Booking Platform

A full-stack movie booking application built with **Next.js 14** + **Express.js** + **MongoDB Atlas** + **Socket.io**, served as a unified monolith.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black?logo=socket.io)

---

## ✨ Features

- **User Authentication** — JWT-based login/register with token refresh
- **Movie Catalog** — Browse now showing & upcoming movies with filters
- **Real-time Seat Selection** — Live seat locking via Socket.io
- **Booking & Payments** — Razorpay integration with promo code support
- **Admin Dashboard** — Full CRUD for movies, theaters, screens, showtimes
- **e-Ticket PDF** — Auto-generated downloadable tickets
- **Responsive UI** — Premium dark-themed design with Framer Motion animations

---

## 🏗️ Project Structure

```
cineverse/
├── server.js                  # Unified Express + Next.js entry point
├── src/
│   ├── app/                   # Next.js 14 App Router (frontend pages)
│   │   ├── page.jsx           # Home — movie listings
│   │   ├── movie/[id]/        # Booking flow (shows → seats → pay)
│   │   ├── admin/             # Admin dashboard
│   │   ├── login/             # Login page
│   │   ├── register/          # Register page
│   │   └── profile/           # User profile & bookings
│   ├── components/            # Reusable React components
│   ├── stores/                # Zustand state management
│   ├── services/              # API client & socket service
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Frontend utilities
│   └── backend/               # Express.js backend
│       ├── config/            # DB, Redis, Socket config
│       ├── controllers/       # Route handlers
│       ├── models/            # Mongoose models (Sequelize-compat bridge)
│       ├── routes/            # Express API routes
│       ├── middleware/        # Auth, error handling
│       ├── seeds/             # Database seeder
│       ├── services/          # Business logic (tickets, etc.)
│       ├── validators/        # Joi validation schemas
│       └── utils/             # Logger, Sequelize bridge
├── uploads/                   # User-uploaded content & tickets
├── package.json
├── next.config.mjs
├── tailwind.config.cjs
├── postcss.config.cjs
└── docker-compose.yml
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **MongoDB Atlas** account (or local MongoDB)
- **Redis** (optional — app works without it)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/cineverse.git
cd cineverse

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, Razorpay keys, etc.

# 4. Seed the database (optional — creates sample data)
npm run seed

# 5. Start development server
npm run dev
```

The app will be running at **http://localhost:3000**

### Default Admin Credentials (after seeding)

| Field    | Value              |
|----------|--------------------|
| Email    | admin@cineverse.com |
| Password | Password@123       |

---

## 📜 Available Scripts

| Command          | Description                              |
|------------------|------------------------------------------|
| `npm run dev`    | Start dev server with hot-reload (nodemon) |
| `npm run build`  | Build Next.js for production             |
| `npm start`      | Start production server                  |
| `npm run seed`   | Seed database with sample data           |
| `npm run lint`   | Run ESLint                               |
| `npm test`       | Run Jest tests                           |

---

## 🔌 API Endpoints

| Method | Endpoint                        | Description            |
|--------|---------------------------------|------------------------|
| POST   | `/api/auth/login`               | User login             |
| POST   | `/api/auth/register`            | User registration      |
| GET    | `/api/movies`                   | List all movies        |
| GET    | `/api/movies/:id`               | Get movie details      |
| GET    | `/api/movies/:id/showtimes`     | Get movie showtimes    |
| GET    | `/api/seats/showtime/:id`       | Get seats for showtime |
| POST   | `/api/bookings`                 | Create booking         |
| POST   | `/api/payments/create`          | Initiate payment       |
| GET    | `/api/theaters`                 | List theaters          |
| GET    | `/api/admin/analytics`          | Admin analytics        |
| POST   | `/api/admin/movies`             | Create movie (admin)   |
| POST   | `/api/admin/theaters`           | Create theater (admin) |
| POST   | `/api/admin/screens`            | Create screen (admin)  |
| POST   | `/api/admin/movies/:id/showtimes` | Create showtime (admin) |
| GET    | `/health`                       | Server health check    |

---

## 🐳 Docker

```bash
# Start with Docker Compose
docker-compose up --build
```

---

## 🛠️ Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Next.js 14, React 18, Zustand, Framer Motion |
| Styling    | Tailwind CSS 3                                |
| Backend    | Express.js 4, Socket.io                       |
| Database   | MongoDB Atlas + Mongoose                      |
| Cache      | Redis (optional)                              |
| Payments   | Razorpay                                      |
| Auth       | JWT (access + refresh tokens)                 |
| PDF        | pdf-lib                                       |

---

## 📄 License

This project is private and proprietary.
