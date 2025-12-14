# NASCON Event Management System

> Comprehensive event management platform for the NASCON competition. Built with Node.js, Express, EJS, and MySQL.

**Status:** Archived / Refactored

## Overview

NASCON Event Management System is a full-featured web application for managing university-level competitions and events. It handles user registrations, event scheduling, venue booking, sponsorships, team management, payments, judging, and scoring with role-based access control.

## Features

- **Authentication & Authorization**
  - Email/password authentication with Passport local strategy
  - Role-based access control (super_admin, admin, event_organizer, participant, sponsor, judge)
  - Session management with secure cookies

- **Event Management**
  - Event lifecycle (Draft, Published, Ongoing, Completed, Cancelled)
  - Categories, venues, fees, deadlines, and judge assignments
  - Individual and team-based participation

- **Registration System**
  - User and team registrations with duplicate detection
  - Password complexity validation
  - Registration success receipts

- **Additional Modules**
  - Payments and sponsorship management
  - Venue scheduling and capacity tracking
  - Accommodation requests
  - Workshop management
  - Judging and scoring system
  - FAQ and contact inquiries

## Project Structure

```
nascon-event-management/
├── src/
│   ├── app.js              # Express application entry point
│   ├── config/
│   │   ├── database.js     # MySQL pool and query helpers
│   │   └── passport.js     # Authentication configuration
│   ├── middleware/
│   │   ├── auth.js         # Authentication guards
│   │   ├── validation.js   # Input validation chains
│   │   └── notification.js # Flash message helpers
│   ├── routes/             # Express route handlers
│   ├── views/              # EJS templates
│   ├── public/             # Static assets (CSS, JS, images)
│   └── utils/              # Utility functions
├── NASCON.sql              # Database schema and seed data
├── package.json
└── README.md
```

## Prerequisites

- Node.js 14+ and npm
- MySQL 8+ (or compatible)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ApatheticMioz/nascon-event-management.git
   cd nascon-event-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env` file in the project root:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=NASCON
   SESSION_SECRET=replace_with_long_random_value
   ```

4. **Set up the database**
   ```bash
   mysql -u <user> -p -e "CREATE DATABASE IF NOT EXISTS NASCON;"
   mysql -u <user> -p NASCON < NASCON.sql
   ```

## Usage

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

The application will be available at `http://localhost:3000` (or the port specified in `.env`).

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node src/app.js` | Start production server |
| `dev` | `nodemon src/app.js` | Start development server with auto-reload |

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **View Engine:** EJS
- **Database:** MySQL (mysql2/promise)
- **Authentication:** Passport.js (local strategy)
- **Validation:** express-validator
- **Security:** helmet, cors, bcrypt

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 