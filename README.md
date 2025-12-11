NASCON Event Management System
==============================

Comprehensive event management platform for the NASCON competition. Built with Node.js, Express, EJS, and MySQL, it handles registrations, event scheduling, venues, sponsors, teams, payments, scoring, and role-based access control.

Features
--------
- Email/password authentication with Passport local strategy, sessions, and privilege-based authorization.
- Event lifecycle: list, view details, create/update/delete with categories, venues, fees, deadlines, and judge assignments.
- User and team registrations with password complexity checks, duplicate detection, and success receipts.
- Payments, sponsors, accommodations, schedules, scores, and FAQs routed through dedicated Express modules.
- Server-side validation (express-validator), notification helper, and consistent error handling.
- Secure defaults: helmet, CORS, session cookies, and MySQL pooled connections with named placeholders.

Tech Stack
----------
- Node.js, Express, EJS
- Passport (local), express-session
- MySQL via mysql2/promise
- Validation: express-validator, custom password rules
- Security and utilities: helmet, cors, multer

Prerequisites
-------------
- Node.js 14+ and npm
- MySQL 8+ (or compatible) with a user that can create databases

Quick Start
-----------
1) Install dependencies

```bash
npm install
```

2) Configure environment

Create a .env file in the project root:

```env
PORT=3000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=NASCON
SESSION_SECRET=replace_with_long_random_value
```

3) Prepare the database

```bash
mysql -u <user> -p -e "CREATE DATABASE IF NOT EXISTS NASCON;"
mysql -u <user> -p NASCON < NASCON.sql
```

4) Run the server

```bash
# development with reload
npm run dev

# production style
npm start
```

Scripts
-------
- start: `node src/app.js`
- dev: `nodemon src/app.js`

Key Modules
-----------
- App shell: [src/app.js](src/app.js) – Express setup, security middleware, view engine, session, Passport, and route wiring.
- Database: [src/config/database.js](src/config/database.js) – MySQL pool, initialization, query helpers, and transaction helper.
- Auth: [src/config/passport.js](src/config/passport.js), [src/middleware/auth.js](src/middleware/auth.js) – Local strategy, serialize/deserialize, privilege loading, guard helpers.
- Validation: [src/middleware/validation.js](src/middleware/validation.js) – Registration and event validation chains.
- Notifications: [src/middleware/notification.js](src/middleware/notification.js) – Session-backed flash-style messages.
- User registration and event signup: [src/routes/registration.js](src/routes/registration.js) – Role mapping, password hashing, duplicate checks, event registration flows.
- Events: [src/routes/events.js](src/routes/events.js) – Listing, CRUD, judge assignments, rankings, participant rosters.
- Homepage: [src/routes/index.js](src/routes/index.js) – Upcoming events grouped by date.
- API/user utilities: [src/routes/auth.js](src/routes/auth.js) – Logout, current-user, admin check, user lookups.

Project Layout
--------------
- src/config – database and Passport setup
- src/middleware – auth, validation, notifications
- src/routes – feature routes (events, registration, sponsors, payments, scores, venues, etc.)
- src/views – EJS templates and partials
- src/public – static assets (CSS, JS, images)

Operational Notes
-----------------
- Session cookies are secure when `NODE_ENV=production`; set `SESSION_SECRET` to a strong value.
- Database helpers log errors with codes for easier debugging; transactions are supported via `executeTransaction`.
- Privileges are loaded from `RolePrivileges` and `UserPrivileges` to enforce fine-grained access.

License
-------
ISC (see package.json)
        * Retrieves and displays a list of teams.
        * Handles creating teams.
        * Manages team members (adding, removing, updating).

* **`src/routes/venues.js`**

    * **Purpose:** Manages venue information.
    * **Key Functionality:**
        * Retrieves and displays a list of venues.
        * Handles adding, editing, and deleting venues (requires authentication and privileges).
        * Provides an API to get venue details.

* **`src/routes/workshops.js`**

    * **Purpose:** Manages workshops and guest speakers.
    * **Key Functionality:**
        * Retrieves and displays lists of workshops and speakers.

### 4. Public Files

* **`src/public/css/`:** Contains CSS files that control the styling of the web pages. Each CSS file is typically associated with a specific page or section of the site.
* **`src/public/js/`:** Contains JavaScript files that add interactivity to the web pages.
    * `competitions.js` (src/public/js/competitions.js): JavaScript for the competitions page.
    * `header.js` (src/public/js/header.js): JavaScript for the header section of the website.
    * `main.js` (src/public/js/main.js): Main JavaScript file with general site functionality.

### 5. Other Important Files

* **`src/app.js`**

    * **Purpose:** This is the entry point of the Node.js application. It sets up the Express.js web server.
    * **Key Functionality:**
        * Imports all the necessary libraries and route files.
        * Configures middleware (e.g., for handling JSON data, sessions, security).
        * Defines the routes of the application (which URLs are handled by which route files).
        * Sets up the view engine (EJS) to render HTML pages.
        * Handles errors and 404 (page not found) scenarios.
        * Starts the server and listens for incoming requests.

* **`package.json`**

    * **Purpose:** A JSON file that contains metadata about the project and its dependencies.
    * **Key Functionality:**
        * `name`, `version`, `description`, etc.: Basic information about the project.
        * `scripts`: Defines commands that can be run with `npm` (e.g., `npm start` to start the server).
        * `dependencies`: Lists the Node.js packages that the project needs to function. `npm install` uses this list to install the packages.
        * `devDependencies`: Lists packages used for development (e.g., testing tools).

* **`NASCON.sql`**

    * **Purpose:** Contains the SQL code to create the database schema (the tables, columns, and relationships) for the NASCON application.
    * **Key Functionality:**
        * `DROP DATABASE IF EXISTS NASCON; CREATE DATABASE NASCON; USE NASCON;`: Commands to delete the database if it exists and create a new one.
        * `CREATE TABLE ...`: SQL statements to create tables like `Users`, `Events`, `Venues`, etc.
        * `ALTER TABLE ...`: SQL statements to modify table structures, add constraints, etc.
        * `INSERT INTO ...`: SQL statements to insert initial data into some tables (e.g., default user roles).
        * `CREATE VIEW ...`: SQL statements to create database views.
        * `CREATE PROCEDURE ...`: SQL statements to create stored procedures.
        * `CREATE TRIGGER ...`: SQL statements to create database triggers.

## Key Features and Functionality

The NASCON Event Management System provides a range of features to manage the competition effectively:

* **User Management:**
    * Allows users to register for accounts with different roles (admin, event organizer, participant, sponsor, judge).
    * Handles user authentication (login and logout).
    * Implements role-based access control, so different users have different permissions.

* **Event Management:**
    * Enables the creation, editing, and deletion of events.
    * Supports event categorization and different event types.
    * Manages event details like date, time, venue, and registration deadlines.
    * Handles event registration and participant tracking.

* **Judging System:**
    * Facilitates the assignment of judges to events.
    * Provides interfaces for judges to submit scores.
    * Calculates rankings based on scores.
    * Displays results.

* **Sponsorship Management:**
    * Manages sponsor profiles and contact information.
    * Defines different sponsorship packages.
    * Tracks sponsorship payments and benefits.

* **Payment System:**
    * Processes registration fees.
    * Handles sponsorship payments.
    * Provides payment verification and financial reporting.

## Common Issues & Solutions

1.  **Database Connection Error**

    * **Solution:**
        * Double-check that the MySQL server is running.
        * Carefully verify the database credentials (username, password, host, database name) in the `.env` file. Even a small typo will cause a connection error.
        * Ensure that the `NASCON` database has been created in MySQL.

2.  **Port Already in Use**

    * **Solution:**
        * The default port for the application is 3000. If another application is already using this port, you'll get an error.
        * You can change the port in the `.env` file by modifying the `PORT` variable.
        * Alternatively, you can identify and stop the process that's currently using the port. The commands to do this vary depending on your operating system.

3.  **Module Not Found Errors**

    * **Solution:**
        * If you see errors like "Cannot find module 'express'", it means the required Node.js packages haven't been installed.
        * Make sure you have navigated to the project directory in your terminal/command prompt and run `npm install` again.
        * Check the `package.json` file to see the list of dependencies.
        * Ensure that the `node_modules` directory exists in your project directory. This directory is where npm installs the packages.

## Required NPM Packages

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "ejs": "^3.1.9",
    "express": "^4.18.3",
    "express-session": "^1.18.0",
    "express-validator": "^7.2.1",
    "helmet": "^7.1.0",
    "multer": "^1.4.5-lts.2",
    "mysql2": "^3.14.1",
    "passport": "^0.7.0",
    "passport-facebook": "^3.0.0",
    "passport-google-oauth20": "^2.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
```

## Contributing
1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## Support
For any questions or issues:
1. Check the common issues section
2. Review error logs
3. Contact the development team

## License
This project is licensed under the MIT License. 