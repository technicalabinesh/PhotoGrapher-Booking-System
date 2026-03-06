# 📸 SnapBook — Photographer Booking System

SnapBook is a full-stack web application that lets users discover and book professional photographers and photography studios across India. Users can browse photographer profiles by specialty and city, choose packages, select available sessions, and manage their bookings — all from a single-page interface.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Usage](#usage)
- [License](#license)

---

## Features

- **Photographer Discovery** — Browse 30+ pre-seeded professional photographers filterable by city, specialty, style, and price range
- **Studio Listings** — Explore photography studios with facility, pricing, and location details
- **User Authentication** — Secure registration and login using JWT-based authentication with bcrypt password hashing
- **Package Selection** — Each photographer offers multiple packages (e.g., Wedding, Portrait, Event) with pricing and deliverables
- **Session Booking** — Book available time slots and sessions with a chosen photographer
- **Booking Management** — View and cancel existing bookings from a personal dashboard
- **Reviews & Ratings** — Leave reviews and star ratings for photographers after a session
- **City-based Filtering** — Search photographers and studios by major Indian cities
- **Responsive UI** — Clean, mobile-friendly single-page frontend with banner carousel and notification system

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript (Single Page)   |
| Backend    | Node.js, Express.js                             |
| Database   | SQLite3 (via `sqlite3` npm package)             |
| Auth       | JSON Web Tokens (JWT), bcryptjs                 |
| Fonts      | Google Fonts — Poppins                          |

---

## Project Structure

```
PhotoGrapher-Booking-System/
├── server.js        # Express API server with all routes and DB logic
├── app.js           # Frontend JavaScript (SPA logic, API calls)
├── index.html       # Main HTML page (single-page application)
├── style.css        # Stylesheet
├── snapbook.db      # SQLite database (auto-created on first run)
├── package.json     # Node.js project metadata and dependencies
└── README.md        # Project documentation
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- npm (bundled with Node.js)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/technicalabinesh/PhotoGrapher-Booking-System.git
   cd PhotoGrapher-Booking-System
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

### Running the Application

**Production mode:**

```bash
npm start
```

**Development mode** (with auto-reload via nodemon):

```bash
npm run dev
```

The API server starts on **http://localhost:3000**.

Open `index.html` directly in your browser (or serve it via any static file server) to use the frontend.

> **Note:** The SQLite database (`snapbook.db`) and all sample data (photographers, studios, packages, sessions) are created automatically the first time the server starts.

---

## API Reference

All API endpoints are prefixed with `/api`. Protected routes require a `Bearer <token>` header (token obtained from `/api/login`).

### Authentication

| Method | Endpoint        | Auth | Description              |
|--------|-----------------|------|--------------------------|
| POST   | `/api/register` | No   | Register a new user      |
| POST   | `/api/login`    | No   | Log in and receive a JWT |

**Register request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "phone": "9876543000",
  "city": "Mumbai"
}
```

**Login request body:**
```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

---

### Photographers

| Method | Endpoint                              | Auth | Description                          |
|--------|---------------------------------------|------|--------------------------------------|
| GET    | `/api/photographers`                  | No   | List all photographers               |
| GET    | `/api/photographers/search`           | No   | Search by city, specialty, or style  |
| GET    | `/api/photographers/:id`              | No   | Get a single photographer's details  |
| GET    | `/api/photographers/:id/packages`     | No   | Get packages for a photographer      |
| GET    | `/api/photographers/:id/sessions`     | No   | Get available sessions               |
| GET    | `/api/photographers/:id/reviews`      | No   | Get reviews for a photographer       |
| POST   | `/api/photographers/:id/review`       | Yes  | Submit a review for a photographer   |

**Search query parameters:** `city`, `specialty`, `style`, `minPrice`, `maxPrice`

---

### Studios

| Method | Endpoint       | Auth | Description        |
|--------|----------------|------|--------------------|
| GET    | `/api/studios` | No   | List all studios   |

---

### Bookings

| Method | Endpoint                    | Auth | Description                    |
|--------|-----------------------------|------|--------------------------------|
| POST   | `/api/bookings`             | Yes  | Create a new booking           |
| GET    | `/api/my-bookings`          | Yes  | List bookings for current user |
| POST   | `/api/bookings/:id/cancel`  | Yes  | Cancel a booking               |

**Create booking request body:**
```json
{
  "session_id": 1,
  "package_id": 2,
  "event_type": "Wedding",
  "event_details": "Indoor ceremony at Taj Hotel"
}
```

---

### Utilities

| Method | Endpoint       | Auth | Description                                  |
|--------|----------------|------|----------------------------------------------|
| GET    | `/api/cities`  | No   | List all cities that have photographers      |
| GET    | `/api/stats`   | No   | Platform statistics (counts of records)      |
| GET    | `/api/sessions/:id` | No | Get details of a specific session       |

---

## Database Schema

The SQLite database contains the following tables:

| Table           | Description                                               |
|-----------------|-----------------------------------------------------------|
| `users`         | Registered user accounts                                  |
| `photographers` | Photographer profiles with specialty, pricing, and rating |
| `studios`       | Photography studio listings                               |
| `packages`      | Photographer-specific booking packages                    |
| `sessions`      | Available time slots per photographer                     |
| `bookings`      | Confirmed bookings linking users, sessions, and packages  |
| `reviews`       | User reviews and ratings for photographers                |

---

## Usage

1. Start the backend server (`npm start`).
2. Open `index.html` in a browser.
3. **Browse** photographers or studios from the navigation bar.
4. **Sign Up** for a new account or **Sign In** if you already have one.
5. Click a photographer card to view their profile, packages, and available sessions.
6. Select a package and an available session, then confirm your booking.
7. View or cancel your bookings from **My Bookings** in the navigation bar.
8. Leave a review for a photographer from your bookings list.

---

## License

This project is licensed under the [ISC License](LICENSE).
