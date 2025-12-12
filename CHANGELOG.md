# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Initial Archival Release

### Added
- Complete event management system for NASCON competition
- User authentication with Passport.js (local strategy)
- Role-based access control (super_admin, admin, event_organizer, participant, sponsor, judge)
- Event lifecycle management (draft, published, ongoing, completed, cancelled)
- Team registration and management with size limits (2-3 members)
- Sponsor management with tiered packages (Platinum, Gold, Silver, Bronze)
- Venue management with scheduling and capacity tracking
- Payment processing for registrations and sponsorships
- Judge assignment and scoring system
- Workshop and accommodation management
- Server-side validation with express-validator
- Security features: helmet, CORS, secure session cookies
- MySQL database with comprehensive schema including:
  - Triggers for payment confirmation and low stock alerts
  - Views for reporting (participants, sponsors, venues, accommodations)
  - Stored procedures for financial summaries and accommodation assignment
  - Scheduled events for automated reminders

### Technical Stack
- Node.js with Express.js framework
- EJS templating engine
- MySQL with mysql2/promise driver
- Passport.js for authentication
- bcrypt for password hashing
- express-validator for input validation
- helmet and cors for security
