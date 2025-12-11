## .\NASCON.sql

```sql
-- =====================================================================
-- NASCON Database Schema - FINAL VERSION
-- Purpose: Complete, self-contained schema for NASCON (Spring 2025)
--          All tables, constraints, triggers, views, procedures, indexes, and seed data
--          'super_admin' role included, 'society representative' role EXCLUDED
-- =====================================================================

-- Drop and create database
DROP DATABASE IF EXISTS NASCON;
CREATE DATABASE NASCON;
USE NASCON;

-- =========================
-- TABLE DEFINITIONS
-- =========================

-- 1. Roles & Access Control
CREATE TABLE Roles (
    RoleID INT AUTO_INCREMENT PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique name for the role (e.g., super_admin, admin, participant, judge, sponsor, event_organizer)'
) COMMENT 'Stores user roles like super_admin, admin, participant, judge, sponsor, event_organizer.';

CREATE TABLE RolePrivileges (
    PrivilegeID INT AUTO_INCREMENT PRIMARY KEY,
    RoleID INT NOT NULL COMMENT 'Foreign key linking to the Roles table',
    Resource VARCHAR(50) NOT NULL COMMENT 'The system resource (e.g., events, users, reports)',
    Action VARCHAR(50) NOT NULL COMMENT 'The action allowed on the resource (e.g., create, read, update, delete, assign_judge)',
    UNIQUE KEY unique_privilege (RoleID, Resource, Action) COMMENT 'Ensure a role doesnt have the same privilege twice',
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT 'Defines fine-grained permissions for each role.';

CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL COMMENT 'Full name of the user',
    Email VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique email address, used for login',
    Password VARCHAR(255) NOT NULL COMMENT 'Hashed password',
    Contact VARCHAR(20) NULL COMMENT 'Phone number (optional)',
    University VARCHAR(100) NULL COMMENT 'User university (for demographics)',
    City VARCHAR(100) NULL COMMENT 'User city (for demographics)',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique username for the system',
    RoleID INT NOT NULL COMMENT 'Foreign key linking to the Roles table',
    Status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active' COMMENT 'User account status',
    LastLogin TIMESTAMP NULL COMMENT 'Timestamp of the last login',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of user creation',
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp of last update',
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE RESTRICT ON UPDATE CASCADE
) COMMENT 'Stores user account information and links to roles.';

-- 2. Venues & Event Categories
CREATE TABLE Venues (
    VenueID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique name of the venue',
    Address VARCHAR(255) NOT NULL COMMENT 'Physical address of the venue',
    Location VARCHAR(255) NULL COMMENT 'Additional location details (e.g., building, floor)',
    Capacity INT NULL CHECK (Capacity IS NULL OR Capacity >= 0) COMMENT 'Maximum seating or participant capacity (optional)',
    Facilities TEXT NULL COMMENT 'Description of available facilities (e.g., Projector, Wi-Fi)',
    MapEmbedURL TEXT NULL COMMENT 'URL for embedding a map (e.g., Google Maps iframe)',
    Description TEXT NULL COMMENT 'General description of the venue',
    ContactPerson VARCHAR(100) NULL COMMENT 'Name of the venue contact person',
    ContactEmail VARCHAR(100) NULL COMMENT 'Email of the venue contact',
    ContactPhone VARCHAR(20) NULL COMMENT 'Phone number of the venue contact',
    VenueType ENUM('Auditorium', 'Hall', 'Lab', 'Outdoor Space', 'Classroom', 'Other') NOT NULL COMMENT 'Type classification of the venue',
    Status ENUM('Available', 'Under Maintenance', 'Unavailable') NOT NULL DEFAULT 'Available' COMMENT 'Current status of the venue',
    Equipment TEXT NULL COMMENT 'List of available equipment',
    Restrictions TEXT NULL COMMENT 'Any restrictions for using the venue',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Stores information about physical locations for events.';

CREATE TABLE EventCategories (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL UNIQUE COMMENT 'Name of the event category (e.g., Tech Events)',
    Description TEXT NULL COMMENT 'Brief description of the category',
    ParentCategoryID INT NULL COMMENT 'Self-referencing key for hierarchical categories (optional)',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ParentCategoryID) REFERENCES EventCategories(CategoryID) ON DELETE SET NULL ON UPDATE CASCADE
) COMMENT 'Stores categories for classifying events.';

-- 3. Sponsors & Sponsorship
CREATE TABLE SponsorshipLevels (
    LevelID INT AUTO_INCREMENT PRIMARY KEY,
    LevelName VARCHAR(50) NOT NULL UNIQUE COMMENT 'Name of the sponsorship level (e.g., Platinum, Gold)',
    DisplayOrder INT NULL COMMENT 'Optional order for displaying levels',
    DefaultDescription TEXT NULL COMMENT 'Optional default description for this level'
) COMMENT 'Defines the distinct sponsorship tiers available.';

CREATE TABLE Sponsors (
    SponsorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(150) NOT NULL COMMENT 'Name of the sponsoring organization or individual',
    ContactPerson VARCHAR(100) NULL COMMENT 'Primary contact person at the sponsor organization',
    Email VARCHAR(100) NULL UNIQUE COMMENT 'Contact email for the sponsor',
    Phone VARCHAR(20) NULL COMMENT 'Contact phone number for the sponsor',
    Status ENUM('active', 'inactive', 'pending_approval', 'potential') NOT NULL DEFAULT 'potential' COMMENT 'Current status of the sponsor relationship',
    LogoURL VARCHAR(255) NULL COMMENT 'URL to the sponsor logo image',
    Website VARCHAR(255) NULL COMMENT 'URL to the sponsor website',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Stores information about organizations or individuals providing sponsorship.';

CREATE TABLE SponsorshipPackages (
    PackageID INT AUTO_INCREMENT PRIMARY KEY,
    LevelID INT NOT NULL COMMENT 'The sponsorship level this package corresponds to (FK to SponsorshipLevels)',
    PackageName VARCHAR(100) NOT NULL UNIQUE COMMENT 'A descriptive name for the package (e.g., Gold Package 2025)',
    Description TEXT NULL COMMENT 'Detailed description of the package',
    Benefits TEXT NOT NULL COMMENT 'List of benefits included in the package',
    Amount DECIMAL(12,2) NOT NULL CHECK (Amount >= 0) COMMENT 'Standard cost of this package',
    DurationMonths INT NULL CHECK (DurationMonths IS NULL OR DurationMonths > 0) COMMENT 'Typical duration of the sponsorship in months (optional)',
    Status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active' COMMENT 'Whether this package is currently offered',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (LevelID) REFERENCES SponsorshipLevels(LevelID) ON DELETE RESTRICT ON UPDATE CASCADE
) COMMENT 'Defines predefined sponsorship packages offered to sponsors.';

CREATE TABLE SponsorshipContracts (
    ContractID INT AUTO_INCREMENT PRIMARY KEY,
    SponsorID INT NOT NULL COMMENT 'The sponsor involved (FK to Sponsors)',
    PackageID INT NULL COMMENT 'The standard package chosen, if any (FK to SponsorshipPackages)',
    CustomLevelID INT NULL COMMENT 'The agreed sponsorship level (FK to SponsorshipLevels) - Can override package level',
    ContractAmount DECIMAL(12, 2) NOT NULL CHECK (ContractAmount >= 0) COMMENT 'Actual amount agreed for this specific contract',
    SignedDate DATE NOT NULL COMMENT 'Date the contract was signed',
    StartDate DATE NOT NULL COMMENT 'Date sponsorship benefits begin',
    EndDate DATE NOT NULL COMMENT 'Date sponsorship benefits end',
    Terms TEXT NULL COMMENT 'Specific terms and conditions of this contract',
    Status ENUM('active', 'expired', 'terminated', 'pending_payment', 'negotiation') NOT NULL DEFAULT 'negotiation' COMMENT 'Status of the contract',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SponsorID) REFERENCES Sponsors(SponsorID) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (PackageID) REFERENCES SponsorshipPackages(PackageID) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (CustomLevelID) REFERENCES SponsorshipLevels(LevelID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CHECK (EndDate >= StartDate)
) COMMENT 'Records the specific agreements made with individual sponsors.';

-- Triggers to enforce: at least one of PackageID or CustomLevelID must be non-NULL
DELIMITER //
CREATE TRIGGER validate_sponsorship_link_on_insert
BEFORE INSERT ON SponsorshipContracts
FOR EACH ROW
BEGIN
    IF NEW.PackageID IS NULL AND NEW.CustomLevelID IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Sponsorship Contract must be linked to either a standard PackageID or a CustomLevelID.';
    END IF;
END//
CREATE TRIGGER validate_sponsorship_link_on_update
BEFORE UPDATE ON SponsorshipContracts
FOR EACH ROW
BEGIN
    IF NEW.PackageID IS NULL AND NEW.CustomLevelID IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Sponsorship Contract must be linked to either a standard PackageID or a CustomLevelID.';
    END IF;
END//
DELIMITER ;

-- 4. Events & Teams
CREATE TABLE Events (
    EventID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(150) NOT NULL COMMENT 'Name of the event',
    Date DATE NOT NULL COMMENT 'Date the event takes place',
    Time TIME NOT NULL COMMENT 'Time the event starts',
    Reg_Fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (Reg_Fee >= 0) COMMENT 'Registration fee (0 for free events)',
    Max_Participants INT NULL CHECK (Max_Participants IS NULL OR Max_Participants > 0) COMMENT 'Maximum number of participants allowed (NULL for unlimited)',
    Rules TEXT NULL COMMENT 'Specific rules for the event',
    EventDescription TEXT NULL COMMENT 'Detailed description of the event',
    OrganizerID INT NULL COMMENT 'User responsible for organizing the event (FK to Users)',
    VenueID INT NULL COMMENT 'Venue where the event is held (FK to Venues)',
    CategoryID INT NOT NULL COMMENT 'Category the event belongs to (FK to EventCategories)',
    EventType ENUM('Individual', 'Team', 'Both') NOT NULL DEFAULT 'Individual' COMMENT 'Specifies if participation is individual, team-based, or both',
    RegistrationDeadline DATETIME NULL COMMENT 'Timestamp after which registration is closed (NULL if no deadline)',
    Status ENUM('Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft' COMMENT 'Current status of the event lifecycle',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event_venue_time (VenueID, Date, Time),
    FOREIGN KEY (OrganizerID) REFERENCES Users(UserID) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (VenueID) REFERENCES Venues(VenueID) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (CategoryID) REFERENCES EventCategories(CategoryID) ON DELETE RESTRICT ON UPDATE CASCADE
) COMMENT 'Stores details for all conventions events like competitions, workshops, etc.';

CREATE TABLE Teams (
    TeamID INT AUTO_INCREMENT PRIMARY KEY,
    TeamName VARCHAR(100) NOT NULL COMMENT 'Name of the team',
    EventID INT NOT NULL COMMENT 'The event this team is registered for (FK to Events)',
    LeaderID INT NOT NULL COMMENT 'The user who created/leads the team (FK to Users)',
    Status ENUM('active', 'inactive', 'disqualified') NOT NULL DEFAULT 'active' COMMENT 'Current status of the team',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_team_event (TeamName, EventID),
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (LeaderID) REFERENCES Users(UserID) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT 'Stores teams formed for team-based events.';

CREATE TABLE TeamMembers (
    TeamMembershipID INT AUTO_INCREMENT PRIMARY KEY,
    TeamID INT NOT NULL COMMENT 'Foreign key linking to the Teams table',
    UserID INT NOT NULL COMMENT 'Foreign key linking to the Users table',
    Role VARCHAR(50) NOT NULL DEFAULT 'Member' COMMENT 'Role within the team (e.g., Member, Co-Leader)',
    JoinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the user joined the team',
    Status ENUM('active', 'inactive', 'pending_invite') NOT NULL DEFAULT 'active' COMMENT 'Status of the membership (e.g., active, invited)',
    UNIQUE KEY unique_user_team (TeamID, UserID),
    FOREIGN KEY (TeamID) REFERENCES Teams(TeamID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT 'Associates users with teams for team-based events.';

-- 5. Registrations (must be before Payments)
CREATE TABLE Registrations (
    RegistrationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL COMMENT 'User who registered (FK to Users)',
    EventID INT NOT NULL COMMENT 'Event registered for (FK to Events)',
    TeamID INT NULL COMMENT 'Team registered with, if applicable (FK to Teams)',
    RegistrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of registration',
    Status ENUM('pending', 'confirmed', 'cancelled', 'waitlisted', 'checked_in') NOT NULL DEFAULT 'pending' COMMENT 'Status of the registration',
    PaymentStatus ENUM('pending', 'paid', 'failed', 'refunded', 'not_required') NOT NULL DEFAULT 'pending' COMMENT 'Status of the payment for this registration',
    SpecialRequirements TEXT NULL COMMENT 'Any special needs or requests from the participant',
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_event_registration (UserID, EventID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (TeamID) REFERENCES Teams(TeamID) ON DELETE SET NULL ON UPDATE CASCADE
) COMMENT 'Tracks participant registrations for specific events.';

-- 6. Payments (must be after all referenced tables)
-- This order is required because Payments references Users, Registrations, SponsorshipContracts
CREATE TABLE Payments (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    Amount DECIMAL(12, 2) NOT NULL CHECK (Amount > 0) COMMENT 'Amount of the payment',
    PaymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when payment was recorded/processed',
    PaymentMethod ENUM('credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'online_gateway', 'other') NOT NULL COMMENT 'Method used for payment',
    Status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending' COMMENT 'Status of the payment transaction',
    TransactionID VARCHAR(255) NULL UNIQUE COMMENT 'Unique ID from payment gateway or bank (if applicable)',
    Description TEXT NULL COMMENT 'Optional description for the payment',
    PayerUserID INT NULL COMMENT 'User who initiated the payment (FK to Users)',
    RelatedRegistrationID INT NULL COMMENT 'Links payment to a specific event registration (FK to Registrations)',
    RelatedContractID INT NULL COMMENT 'Links payment to a specific sponsorship contract (FK to SponsorshipContracts)',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (PayerUserID) REFERENCES Users(UserID) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (RelatedRegistrationID) REFERENCES Registrations(RegistrationID) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (RelatedContractID) REFERENCES SponsorshipContracts(ContractID) ON DELETE SET NULL ON UPDATE CASCADE
) COMMENT 'Stores all financial transactions for registrations and sponsorships.';

-- Triggers to enforce: at least one of RelatedRegistrationID or RelatedContractID must be non-NULL, but not both
DELIMITER //
CREATE TRIGGER validate_payment_relation_on_insert
BEFORE INSERT ON Payments
FOR EACH ROW
BEGIN
    IF NEW.RelatedRegistrationID IS NULL AND NEW.RelatedContractID IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Payment must be related to either a Registration or a Sponsorship Contract.';
    END IF;
    IF NEW.RelatedRegistrationID IS NOT NULL AND NEW.RelatedContractID IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Payment cannot be related to both a Registration and a Sponsorship Contract simultaneously.';
    END IF;
END//
CREATE TRIGGER validate_payment_relation_on_update
BEFORE UPDATE ON Payments
FOR EACH ROW
BEGIN
    IF NEW.RelatedRegistrationID IS NULL AND NEW.RelatedContractID IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Payment must be related to either a Registration or a Sponsorship Contract.';
    END IF;
    IF NEW.RelatedRegistrationID IS NOT NULL AND NEW.RelatedContractID IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Payment cannot be related to both a Registration and a Sponsorship Contract simultaneously.';
    END IF;
END//
DELIMITER ;

-- =========================
-- END OF TABLE DEFINITIONS
-- =========================

-- =========================
-- ADDITIONAL TABLES (for referenced objects)
-- =========================

-- Judges Table
CREATE TABLE Judges (
    JudgeID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL UNIQUE COMMENT 'FK to Users (must have judge role)',
    Specialization VARCHAR(100) NULL COMMENT 'Area of expertise',
    Status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT 'Stores judge profiles.';

-- EventJudges Table
CREATE TABLE EventJudges (
    EventID INT NOT NULL COMMENT 'FK to Events',
    JudgeID INT NOT NULL COMMENT 'FK to Judges',
    AssignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('assigned', 'removed') NOT NULL DEFAULT 'assigned',
    PRIMARY KEY (EventID, JudgeID),
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (JudgeID) REFERENCES Judges(JudgeID) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT 'Links judges to events.';

-- Scores Table
CREATE TABLE Scores (
    ScoreID INT AUTO_INCREMENT PRIMARY KEY,
    EventID INT NOT NULL COMMENT 'FK to Events',
    RegistrationID INT NULL COMMENT 'FK to Registrations (if individual)',
    JudgeID INT NOT NULL COMMENT 'FK to Judges',
    Value DECIMAL(5,2) NOT NULL CHECK (Value >= 0) COMMENT 'Score value',
    Comments TEXT NULL COMMENT 'Judge comments',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (RegistrationID) REFERENCES Registrations(RegistrationID) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (JudgeID) REFERENCES Judges(JudgeID) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT 'Stores scores given by judges.';

-- Workshops Table
CREATE TABLE Workshops (
    WorkshopID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT NULL,
    InstructorUserID INT NOT NULL COMMENT 'FK to Users (instructor)',
    Date DATE NOT NULL,
    Time TIME NOT NULL,
    VenueID INT NULL COMMENT 'FK to Venues',
    Capacity INT NOT NULL CHECK (Capacity > 0),
    RegFee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    Status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (InstructorUserID) REFERENCES Users(UserID) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (VenueID) REFERENCES Venues(VenueID) ON DELETE SET NULL ON UPDATE CASCADE
) COMMENT 'Workshop sessions.';

-- WorkshopRegistrations Table
CREATE TABLE WorkshopRegistrations (
    WorkshopRegistrationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL COMMENT 'FK to Users',
    WorkshopID INT NOT NULL COMMENT 'FK to Workshops',
    RegistrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
    PaymentStatus ENUM('pending', 'paid', 'refunded', 'not_required') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (WorkshopID) REFERENCES Workshops(WorkshopID) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT 'Tracks workshop registrations.';

-- Accommodations Table
CREATE TABLE Accommodations (
    AccommodationID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Location VARCHAR(255) NOT NULL,
    Capacity INT NOT NULL CHECK (Capacity > 0),
    Availability ENUM('Available', 'Unavailable', 'Maintenance') NOT NULL DEFAULT 'Available',
    BudgetRange VARCHAR(100) NULL,
    PhotoURLs TEXT NULL,
    Description TEXT NULL,
    Amenities TEXT NULL,
    ContactInfo VARCHAR(255) NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Accommodation facilities.';

-- AccommodationRequests Table
CREATE TABLE AccommodationRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL COMMENT 'FK to Users',
    CheckInDate DATE NOT NULL,
    CheckOutDate DATE NOT NULL,
    NumberOfPeople INT NOT NULL CHECK (NumberOfPeople > 0),
    Status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled', 'Waitlisted') NOT NULL DEFAULT 'Pending',
    AssignedAccommodationID INT NULL COMMENT 'FK to Accommodations',
    AssignmentNotes TEXT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AssignedAccommodationID) REFERENCES Accommodations(AccommodationID) ON DELETE SET NULL ON UPDATE CASCADE
) COMMENT 'Requests for accommodation.';

-- InventoryItems Table
CREATE TABLE InventoryItems (
    ItemID INT AUTO_INCREMENT PRIMARY KEY,
    ItemName VARCHAR(150) NOT NULL UNIQUE,
    Description TEXT NULL,
    QuantityOnHand INT NOT NULL DEFAULT 0 CHECK (QuantityOnHand >= 0),
    Category ENUM('Merchandise', 'Equipment', 'Supplies', 'Other') NOT NULL,
    LocationStored VARCHAR(255) NULL,
    LowStockThreshold INT NULL CHECK (LowStockThreshold IS NULL OR LowStockThreshold >= 0),
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT 'Inventory tracking.';

-- SystemAlerts Table
CREATE TABLE SystemAlerts (
    AlertID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NULL COMMENT 'FK to Users (recipient)',
    TargetRoleID INT NULL COMMENT 'FK to Roles (for role-wide alerts)',
    AlertType VARCHAR(50) NOT NULL,
    Message TEXT NOT NULL,
    RelatedEventID INT NULL COMMENT 'FK to Events',
    RelatedItemID INT NULL COMMENT 'FK to InventoryItems',
    IsRead BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (TargetRoleID) REFERENCES Roles(RoleID) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (RelatedEventID) REFERENCES Events(EventID) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (RelatedItemID) REFERENCES InventoryItems(ItemID) ON DELETE SET NULL ON UPDATE CASCADE
) COMMENT 'System-generated alerts and notifications.';

-- ContactInquiries Table
CREATE TABLE ContactInquiries (
    InquiryID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Subject VARCHAR(200) NOT NULL,
    Message TEXT NOT NULL,
    Status ENUM('Pending', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Contact form submissions.';

-- =========================
-- SEED DATA (for demo)
-- =========================

-- Roles
INSERT INTO Roles (RoleName) VALUES
    ('super_admin'),
    ('admin'),
    ('event_organizer'),
    ('participant'),
    ('sponsor'),
    ('judge');

-- Event Categories
INSERT INTO EventCategories (CategoryName, Description) VALUES
    ('Technical', 'Technical competitions and workshops'),
    ('Business', 'Business and entrepreneurship events'),
    ('Cultural', 'Cultural and social events'),
    ('Sports', 'Sports and recreational events');

-- Demo Users (one per role, with placeholder passwords)
INSERT INTO Users (Name, Email, Password, username, RoleID, Status) VALUES
    ('Super Admin', 'superadmin@nascon.com', 'demo_pass', 'superadmin', 1, 'active'),
    ('Admin User', 'admin@nascon.com', 'demo_pass', 'admin', 2, 'active'),
    ('Organizer User', 'organizer@nascon.com', 'demo_pass', 'organizer', 3, 'active'),
    ('Participant User', 'participant@nascon.com', 'demo_pass', 'participant', 4, 'active'),
    ('Sponsor User', 'sponsor@nascon.com', 'demo_pass', 'sponsor', 5, 'active'),
    ('Judge User', 'judge@nascon.com', 'demo_pass', 'judge', 6, 'active');

-- =========================
-- END OF SEED DATA
-- =========================

-- =========================
-- DCL EXAMPLES (PRIVILEGES)
-- =========================
-- All privileges are granted at the very end of the file, after all tables, triggers, procedures, and events are created, to avoid 'table does not exist' errors.
-- IMPORTANT: Table names in GRANT statements must match the case used in CREATE TABLE statements (e.g., EventJudges, not eventjudges or EVENTJUDGES).

-- Example MySQL users for demo (replace passwords in production)
CREATE USER IF NOT EXISTS 'nascon_admin'@'localhost' IDENTIFIED BY 'ReplaceAdminPass123!';
CREATE USER IF NOT EXISTS 'nascon_organizer'@'localhost' IDENTIFIED BY 'ReplaceOrgPass123!';
CREATE USER IF NOT EXISTS 'nascon_participant'@'localhost' IDENTIFIED BY 'ReplacePartPass123!';
CREATE USER IF NOT EXISTS 'nascon_judge'@'localhost' IDENTIFIED BY 'ReplaceJudgePass123!';
CREATE USER IF NOT EXISTS 'nascon_sponsor'@'localhost' IDENTIFIED BY 'ReplaceSponPass123!';
CREATE USER IF NOT EXISTS 'nascon_superadmin'@'localhost' IDENTIFIED BY 'ReplaceSuperAdminPass123!';

-- Grant privileges for each role (demo, not production security)
-- Super Admin: all privileges
GRANT ALL PRIVILEGES ON NASCON.* TO 'nascon_superadmin'@'localhost';

-- Admin: broad privileges
GRANT ALL PRIVILEGES ON NASCON.* TO 'nascon_admin'@'localhost';

-- Event Organizer: manage own events, view venues, assign judges
GRANT SELECT, INSERT, UPDATE, DELETE ON NASCON.Events TO 'nascon_organizer'@'localhost';
GRANT SELECT ON NASCON.Venues TO 'nascon_organizer'@'localhost';
GRANT SELECT ON NASCON.Registrations TO 'nascon_organizer'@'localhost';
GRANT SELECT ON NASCON.Users TO 'nascon_organizer'@'localhost';
GRANT SELECT ON NASCON.Teams TO 'nascon_organizer'@'localhost';
GRANT SELECT ON NASCON.TeamMembers TO 'nascon_organizer'@'localhost';

-- Participant: register for events, manage own teams, request accommodation
GRANT SELECT ON NASCON.Events TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.Venues TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.Workshops TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.EventCategories TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.SponsorshipLevels TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.SponsorshipPackages TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.Sponsors TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.Teams TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.TeamMembers TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.Judges TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.Accommodations TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.Users TO 'nascon_participant'@'localhost';
GRANT UPDATE(Name, Email, Password, Contact, University, City) ON NASCON.Users TO 'nascon_participant'@'localhost';
GRANT INSERT ON NASCON.Registrations TO 'nascon_participant'@'localhost';
GRANT INSERT ON NASCON.WorkshopRegistrations TO 'nascon_participant'@'localhost';
GRANT INSERT ON NASCON.Teams TO 'nascon_participant'@'localhost';
GRANT INSERT, DELETE, UPDATE(Role, Status) ON NASCON.TeamMembers TO 'nascon_participant'@'localhost';
GRANT INSERT ON NASCON.AccommodationRequests TO 'nascon_participant'@'localhost';
GRANT SELECT ON NASCON.AccommodationRequests TO 'nascon_participant'@'localhost';

-- Judge: view assigned events, enter scores
GRANT SELECT ON NASCON.Events TO 'nascon_judge'@'localhost';
GRANT SELECT ON NASCON.Registrations TO 'nascon_judge'@'localhost';
GRANT SELECT ON NASCON.Users TO 'nascon_judge'@'localhost';
GRANT SELECT ON NASCON.Teams TO 'nascon_judge'@'localhost';
GRANT SELECT ON NASCON.TeamMembers TO 'nascon_judge'@'localhost';
GRANT SELECT ON NASCON.Scores TO 'nascon_judge'@'localhost';
GRANT INSERT, UPDATE(Value, Comments) ON NASCON.Scores TO 'nascon_judge'@'localhost';

-- Sponsor: view and manage own sponsorships
GRANT SELECT ON NASCON.SponsorshipLevels TO 'nascon_sponsor'@'localhost';
GRANT SELECT ON NASCON.SponsorshipPackages TO 'nascon_sponsor'@'localhost';
GRANT SELECT ON NASCON.Sponsors TO 'nascon_sponsor'@'localhost';
GRANT SELECT ON NASCON.SponsorshipContracts TO 'nascon_sponsor'@'localhost';
GRANT UPDATE(Name, ContactPerson, Email, Phone, LogoURL, Website) ON NASCON.Sponsors TO 'nascon_sponsor'@'localhost';
GRANT INSERT, UPDATE(Status, Terms) ON NASCON.SponsorshipContracts TO 'nascon_sponsor'@'localhost';

FLUSH PRIVILEGES;

-- =========================
-- END OF DCL EXAMPLES
-- =========================

-- =========================
-- VIEWS
-- =========================

-- View: Event Participants Details (Includes Demographics)
CREATE OR REPLACE VIEW View_EventParticipants AS
SELECT
    r.RegistrationID,
    e.EventID,
    e.Name AS EventName,
    e.Date AS EventDate,
    e.Time AS EventTime,
    u.UserID,
    u.Name AS ParticipantName,
    u.Email AS ParticipantEmail,
    u.username AS ParticipantUsername,
    u.University AS ParticipantUniversity,
    u.City AS ParticipantCity,
    t.TeamID,
    t.TeamName,
    r.RegistrationDate,
    r.Status AS RegistrationStatus,
    r.PaymentStatus
FROM Registrations r
JOIN Events e ON r.EventID = e.EventID
JOIN Users u ON r.UserID = u.UserID
LEFT JOIN Teams t ON r.TeamID = t.TeamID;

-- View: Workshop Registrations Details
CREATE OR REPLACE VIEW View_WorkshopRegistrationDetails AS
SELECT
    wr.WorkshopRegistrationID,
    w.WorkshopID,
    w.Title AS WorkshopTitle,
    w.Date AS WorkshopDate,
    w.Time AS WorkshopTime,
    u.UserID,
    u.Name AS ParticipantName,
    u.Email AS ParticipantEmail,
    u.username AS ParticipantUsername,
    wr.RegistrationDate,
    wr.Status AS RegistrationStatus,
    wr.PaymentStatus
FROM WorkshopRegistrations wr
JOIN Workshops w ON wr.WorkshopID = w.WorkshopID
JOIN Users u ON wr.UserID = u.UserID;

-- View: Team Details with Members
CREATE OR REPLACE VIEW View_TeamDetails AS
SELECT
    t.TeamID,
    t.TeamName,
    e.EventID,
    e.Name AS EventName,
    l.UserID AS LeaderUserID,
    l.Name AS LeaderName,
    l.username AS LeaderUsername,
    (SELECT COUNT(*) FROM TeamMembers tm_count WHERE tm_count.TeamID = t.TeamID AND tm_count.Status = 'active') AS ActiveMemberCount,
    GROUP_CONCAT(DISTINCT m.Name ORDER BY m.Name SEPARATOR ', ') AS ActiveTeamMemberNames,
    t.Status AS TeamStatus,
    t.CreatedAt AS TeamCreatedAt
FROM Teams t
JOIN Events e ON t.EventID = e.EventID
JOIN Users l ON t.LeaderID = l.UserID
LEFT JOIN TeamMembers tm ON t.TeamID = tm.TeamID AND tm.Status = 'active'
LEFT JOIN Users m ON tm.UserID = m.UserID
GROUP BY t.TeamID, t.TeamName, e.EventID, e.Name, l.UserID, l.Name, l.username, t.Status, t.CreatedAt;

-- View: Venue Utilization Report
CREATE OR REPLACE VIEW View_VenueUtilizationReport AS
SELECT
    v.VenueID,
    v.Name AS VenueName,
    v.Capacity AS VenueCapacity,
    e.Date AS EventDate,
    COUNT(e.EventID) AS EventsScheduledOnDate,
    SUM(COALESCE(vp.ConfirmedParticipantCount, 0)) AS TotalConfirmedParticipantsOnDate,
    CASE
        WHEN v.Capacity IS NULL OR v.Capacity <= 0 THEN NULL
        ELSE ROUND((SUM(COALESCE(vp.ConfirmedParticipantCount, 0)) / v.Capacity) * 100, 2)
    END AS EstimatedOccupancyPercent
FROM Venues v
LEFT JOIN Events e ON v.VenueID = e.VenueID AND e.Status IN ('Published', 'Ongoing', 'Completed')
LEFT JOIN (
    SELECT EventID, COUNT(RegistrationID) AS ConfirmedParticipantCount
    FROM Registrations WHERE Status = 'confirmed' GROUP BY EventID
) vp ON e.EventID = vp.EventID
WHERE e.Date IS NOT NULL
GROUP BY v.VenueID, v.Name, v.Capacity, e.Date
ORDER BY v.Name, e.Date;

-- View: Participant Demographics Report
CREATE OR REPLACE VIEW View_ParticipantDemographicsReport AS
SELECT
    COALESCE(u.City, 'Unknown') AS City,
    COALESCE(u.University, 'Unknown') AS University,
    COUNT(DISTINCT u.UserID) AS ParticipantCount
FROM Users u
WHERE u.RoleID = (SELECT RoleID FROM Roles WHERE RoleName = 'participant')
   OR u.UserID IN (SELECT DISTINCT r.UserID FROM Registrations r)
   OR u.UserID IN (SELECT DISTINCT wr.UserID FROM WorkshopRegistrations wr)
GROUP BY u.City, u.University WITH ROLLUP
ORDER BY
    CASE WHEN u.City IS NULL THEN 1 ELSE 0 END, u.City,
    CASE WHEN u.University IS NULL THEN 1 ELSE 0 END, u.University;

-- View: Sponsorship Summary Report
CREATE OR REPLACE VIEW View_SponsorshipSummaryReport AS
SELECT
    sl.LevelName AS SponsorshipLevel,
    COUNT(DISTINCT c.SponsorID) AS NumberOfSponsors,
    COALESCE(SUM(c.ContractAmount), 0.00) AS TotalContractAmount,
    COALESCE(SUM(p.TotalAmountPaid), 0.00) AS TotalAmountPaid,
    (COALESCE(SUM(c.ContractAmount), 0.00) - COALESCE(SUM(p.TotalAmountPaid), 0.00)) AS RemainingAmountDue
FROM SponsorshipLevels sl
LEFT JOIN SponsorshipContracts c ON sl.LevelID = c.CustomLevelID AND c.Status IN ('active', 'expired', 'pending_payment')
LEFT JOIN (
    SELECT RelatedContractID, SUM(Amount) AS TotalAmountPaid
    FROM Payments
    WHERE Status = 'completed' AND RelatedContractID IS NOT NULL
    GROUP BY RelatedContractID
) p ON c.ContractID = p.RelatedContractID
GROUP BY sl.LevelID, sl.LevelName, sl.DisplayOrder
ORDER BY sl.DisplayOrder, sl.LevelName;

-- View: Accommodation Occupancy Report
CREATE OR REPLACE VIEW View_AccommodationOccupancyReport AS
SELECT
    a.AccommodationID,
    a.Name AS AccommodationName,
    a.Location AS AccommodationLocation,
    a.Capacity AS TotalCapacity,
    COALESCE(SUM(CASE WHEN ar.Status = 'Approved' THEN ar.NumberOfPeople ELSE 0 END), 0) AS PeopleAssigned,
    CASE
        WHEN a.Capacity IS NULL THEN NULL
        ELSE (a.Capacity - COALESCE(SUM(CASE WHEN ar.Status = 'Approved' THEN ar.NumberOfPeople ELSE 0 END), 0))
    END AS RemainingCapacity,
    COUNT(CASE WHEN ar.Status = 'Approved' THEN ar.RequestID END) AS ApprovedRequestsCount,
    COUNT(CASE WHEN ar.Status = 'Pending' THEN ar.RequestID END) AS PendingRequestsCount,
    COUNT(CASE WHEN ar.Status = 'Waitlisted' THEN ar.RequestID END) AS WaitlistedRequestsCount
FROM Accommodations a
LEFT JOIN AccommodationRequests ar ON a.AccommodationID = ar.AssignedAccommodationID
GROUP BY a.AccommodationID, a.Name, a.Location, a.Capacity
ORDER BY a.Name;

-- =========================
-- END OF VIEWS
-- =========================

-- =========================
-- INDEXES
-- =========================

-- Users Table
CREATE INDEX idx_users_role ON Users(RoleID);
CREATE INDEX idx_users_status ON Users(Status);
CREATE INDEX idx_users_university ON Users(University);
CREATE INDEX idx_users_city ON Users(City);

-- Events Table
CREATE INDEX idx_events_date ON Events(Date);
CREATE INDEX idx_events_venue ON Events(VenueID);
CREATE INDEX idx_events_category ON Events(CategoryID);
CREATE INDEX idx_events_status ON Events(Status);
CREATE INDEX idx_events_organizer ON Events(OrganizerID);

-- Registrations Table
CREATE INDEX idx_registrations_event ON Registrations(EventID);
CREATE INDEX idx_registrations_user ON Registrations(UserID);
CREATE INDEX idx_registrations_team ON Registrations(TeamID);
CREATE INDEX idx_registrations_status ON Registrations(Status);
CREATE INDEX idx_registrations_payment_status ON Registrations(PaymentStatus);

-- Payments Table
CREATE INDEX idx_payments_status ON Payments(Status);
CREATE INDEX idx_payments_payer ON Payments(PayerUserID);
CREATE INDEX idx_payments_registration ON Payments(RelatedRegistrationID);
CREATE INDEX idx_payments_contract ON Payments(RelatedContractID);
CREATE INDEX idx_payments_date ON Payments(PaymentDate);

-- Scores Table
CREATE INDEX idx_scores_event ON Scores(EventID);
CREATE INDEX idx_scores_registration ON Scores(RegistrationID);
CREATE INDEX idx_scores_judge ON Scores(JudgeID);

-- Teams Table
CREATE INDEX idx_teams_event ON Teams(EventID);
CREATE INDEX idx_teams_leader ON Teams(LeaderID);

-- TeamMembers Table
CREATE INDEX idx_teammembers_team ON TeamMembers(TeamID);
CREATE INDEX idx_teammembers_user ON TeamMembers(UserID);

-- Sponsors Table
CREATE INDEX idx_sponsors_status ON Sponsors(Status);

-- SponsorshipContracts Table
CREATE INDEX idx_sponsorshipcontracts_sponsor ON SponsorshipContracts(SponsorID);
CREATE INDEX idx_sponsorshipcontracts_package ON SponsorshipContracts(PackageID);
CREATE INDEX idx_sponsorshipcontracts_level ON SponsorshipContracts(CustomLevelID);
CREATE INDEX idx_sponsorshipcontracts_status ON SponsorshipContracts(Status);
CREATE INDEX idx_sponsorshipcontracts_dates ON SponsorshipContracts(StartDate, EndDate);

-- Venues Table
CREATE INDEX idx_venues_type ON Venues(VenueType);
CREATE INDEX idx_venues_status ON Venues(Status);

-- Accommodations Table
CREATE INDEX idx_accommodations_availability ON Accommodations(Availability);
CREATE INDEX idx_accommodations_capacity ON Accommodations(Capacity);

-- AccommodationRequests Table
CREATE INDEX idx_accrequests_user ON AccommodationRequests(UserID);
CREATE INDEX idx_accrequests_status ON AccommodationRequests(Status);
CREATE INDEX idx_accrequests_assigned ON AccommodationRequests(AssignedAccommodationID);
CREATE INDEX idx_accrequests_dates ON AccommodationRequests(CheckInDate, CheckOutDate);

-- InventoryItems Table
CREATE INDEX idx_inventory_category ON InventoryItems(Category);
CREATE INDEX idx_inventory_quantity ON InventoryItems(QuantityOnHand);

-- SystemAlerts Table
CREATE INDEX idx_alerts_user ON SystemAlerts(UserID);
CREATE INDEX idx_alerts_role ON SystemAlerts(TargetRoleID);
CREATE INDEX idx_alerts_type ON SystemAlerts(AlertType);
CREATE INDEX idx_alerts_isread ON SystemAlerts(IsRead);
CREATE INDEX idx_alerts_created ON SystemAlerts(CreatedAt);

-- Workshops Table
CREATE INDEX idx_workshops_date ON Workshops(Date);
CREATE INDEX idx_workshops_status ON Workshops(Status);
CREATE INDEX idx_workshops_instructor ON Workshops(InstructorUserID);
CREATE INDEX idx_workshops_venue ON Workshops(VenueID);

-- WorkshopRegistrations Table
CREATE INDEX idx_workshopregistrations_user ON WorkshopRegistrations(UserID);
CREATE INDEX idx_workshopregistrations_workshop ON WorkshopRegistrations(WorkshopID);
CREATE INDEX idx_workshopregistrations_status ON WorkshopRegistrations(Status);

-- ContactInquiries Table
CREATE INDEX idx_inquiries_status ON ContactInquiries(Status);
CREATE INDEX idx_inquiries_email ON ContactInquiries(Email);

-- =========================
-- END OF INDEXES
-- =========================

-- =========================
-- TRIGGERS
-- =========================

-- Example: Trigger to mark registration as confirmed when payment is completed
DELIMITER //
CREATE TRIGGER ConfirmRegistrationOnPayment
AFTER UPDATE ON Payments
FOR EACH ROW
BEGIN
    IF OLD.Status != 'completed' AND NEW.Status = 'completed' AND NEW.RelatedRegistrationID IS NOT NULL THEN
        UPDATE Registrations
        SET Status = 'confirmed',
            PaymentStatus = 'paid'
        WHERE RegistrationID = NEW.RelatedRegistrationID
          AND Status IN ('pending', 'waitlisted');
    END IF;
END//
DELIMITER ;

-- Example: Trigger for low stock alert
DELIMITER //
CREATE TRIGGER CheckLowStockOnUpdate
AFTER UPDATE ON InventoryItems
FOR EACH ROW
BEGIN
    IF NEW.QuantityOnHand < OLD.QuantityOnHand AND
       NEW.LowStockThreshold IS NOT NULL AND
       NEW.QuantityOnHand < NEW.LowStockThreshold AND
       OLD.QuantityOnHand >= NEW.LowStockThreshold THEN
        IF NOT EXISTS (SELECT 1 FROM SystemAlerts
                       WHERE AlertType = 'LowInventory'
                         AND RelatedItemID = NEW.ItemID
                         AND IsRead = FALSE
                         AND CreatedAt > NOW() - INTERVAL 1 HOUR) THEN
            INSERT INTO SystemAlerts (AlertType, Message, RelatedItemID, TargetRoleID)
            SELECT 'LowInventory',
                   CONCAT('Low stock alert: Item "', NEW.ItemName, '" (ID: ', NEW.ItemID, ') has reached ', NEW.QuantityOnHand, ' units (Threshold: ', NEW.LowStockThreshold, ').'),
                   NEW.ItemID,
                   r.RoleID
            FROM Roles r WHERE r.RoleName IN ('admin', 'super_admin');
        END IF;
    END IF;
END//
DELIMITER ;

-- =========================
-- END OF TRIGGERS
-- =========================

-- =========================
-- STORED PROCEDURES
-- =========================

DELIMITER //
-- Procedure: Generate Financial Summary
CREATE PROCEDURE GenerateFinancialSummary()
BEGIN
    SELECT 'Registration Revenue' AS Source, COALESCE(SUM(Amount), 0.00) AS TotalAmount
    FROM Payments
    WHERE RelatedRegistrationID IS NOT NULL AND Status = 'completed'
    UNION ALL
    SELECT 'Sponsorship Revenue' AS Source, COALESCE(SUM(Amount), 0.00) AS TotalAmount
    FROM Payments
    WHERE RelatedContractID IS NOT NULL AND Status = 'completed';
END//

-- Procedure: Assign Accommodation
CREATE PROCEDURE AssignAccommodation (
    IN p_RequestID INT,
    OUT p_Success BOOLEAN,
    OUT p_Message VARCHAR(255)
)
proc_assign_acc: BEGIN
    DECLARE v_UserID INT;
    DECLARE v_CheckInDate DATE;
    DECLARE v_CheckOutDate DATE;
    DECLARE v_NumberOfPeople INT;
    DECLARE v_AssignedAccommodationID INT DEFAULT NULL;
    DECLARE v_RequestStatus ENUM('Pending', 'Approved', 'Rejected', 'Cancelled', 'Waitlisted');
    SET p_Success = FALSE;
    SET p_Message = 'Initialization error.';
    SELECT UserID, CheckInDate, CheckOutDate, NumberOfPeople, Status
    INTO v_UserID, v_CheckInDate, v_CheckOutDate, v_NumberOfPeople, v_RequestStatus
    FROM AccommodationRequests
    WHERE RequestID = p_RequestID;
    IF v_UserID IS NULL THEN
        SET p_Message = CONCAT('Error: Accommodation request ID ', p_RequestID, ' not found.');
        LEAVE proc_assign_acc;
    END IF;
    IF v_RequestStatus != 'Pending' THEN
        SET p_Message = CONCAT('Error: Request ID ', p_RequestID, ' is already processed (Status: ', v_RequestStatus, ').');
        LEAVE proc_assign_acc;
    END IF;
    SELECT a.AccommodationID INTO v_AssignedAccommodationID
    FROM Accommodations a
    WHERE a.Capacity >= v_NumberOfPeople
      AND a.Availability != 'Unavailable'
      AND NOT EXISTS (
          SELECT 1
          FROM AccommodationRequests ar
          WHERE ar.AssignedAccommodationID = a.AccommodationID
            AND ar.Status = 'Approved'
            AND ar.RequestID != p_RequestID
            AND ar.CheckInDate < v_CheckOutDate
            AND ar.CheckOutDate > v_CheckInDate
      )
    ORDER BY a.Capacity ASC
    LIMIT 1;
    IF v_AssignedAccommodationID IS NOT NULL THEN
        UPDATE AccommodationRequests
        SET Status = 'Approved',
            AssignedAccommodationID = v_AssignedAccommodationID,
            AssignmentNotes = CONCAT('Automatically assigned to accommodation ID: ', v_AssignedAccommodationID, ' by procedure.')
        WHERE RequestID = p_RequestID;
        SET p_Success = TRUE;
        SET p_Message = CONCAT('Success: Accommodation ID ', v_AssignedAccommodationID, ' assigned to request ID ', p_RequestID, '.');
    ELSE
        UPDATE AccommodationRequests
        SET Status = 'Rejected',
            AssignmentNotes = 'No suitable accommodation available matching capacity and date availability.'
        WHERE RequestID = p_RequestID;
        SET p_Success = FALSE;
        SET p_Message = CONCAT('Failure: No suitable accommodation found for request ID ', p_RequestID, '.');
    END IF;
END//
DELIMITER ;

-- =========================
-- END OF STORED PROCEDURES
-- =========================

-- =========================
-- SCHEDULED EVENTS
-- =========================

DELIMITER //
CREATE EVENT IF NOT EXISTS GenerateEventReminders
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURDATE() + INTERVAL 1 DAY + INTERVAL 3 HOUR)
COMMENT 'Generates reminder alerts for confirmed participants 3 days before an event start date.'
DO
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_event_id INT;
    DECLARE v_event_name VARCHAR(150);
    DECLARE v_event_date DATE;
    DECLARE v_event_time TIME;
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE cur_reminders CURSOR FOR
        SELECT r.UserID, r.EventID, e.Name, e.Date, e.Time
        FROM Registrations r
        JOIN Events e ON r.EventID = e.EventID
        WHERE r.Status = 'confirmed'
          AND e.Status = 'Published'
          AND e.Date = DATE(NOW() + INTERVAL 3 DAY);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    OPEN cur_reminders;
    read_loop: LOOP
        FETCH cur_reminders INTO v_user_id, v_event_id, v_event_name, v_event_date, v_event_time;
        IF v_done THEN
            LEAVE read_loop;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM SystemAlerts
                       WHERE AlertType = 'EventReminder'
                         AND UserID = v_user_id
                         AND RelatedEventID = v_event_id
                         AND CreatedAt > NOW() - INTERVAL 2 DAY) THEN
            INSERT INTO SystemAlerts (UserID, AlertType, Message, RelatedEventID, IsRead)
            VALUES (
                v_user_id,
                'EventReminder',
                CONCAT('Reminder: Your event "', v_event_name, '" is scheduled for ', DATE_FORMAT(v_event_date, '%W, %M %e, %Y'), ' at ', TIME_FORMAT(v_event_time, '%h:%i %p'), '.'),
                v_event_id,
                FALSE
            );
        END IF;
    END LOOP read_loop;
    CLOSE cur_reminders;
END //
DELIMITER ;

-- =========================
-- END OF SCHEDULED EVENTS
-- ========================= 
-- ==================================================
-- NASCON Dummy Data Generation Script (v2)
-- Purpose: Populate tables with testing data, respecting constraints.
-- Uses SQL variables to handle AUTO_INCREMENT IDs for Foreign Keys.
-- Assumes execution after the main schema script (which drops/creates the DB).
-- * FIX: Added workaround for linking Workshop Payments via a generic Registration.
-- ==================================================

USE NASCON;

-- Disable FK checks temporarily for potentially complex seeding/ordering if needed (optional, usually not required if order is correct)
-- SET FOREIGN_KEY_CHECKS=0;

-- =========================
-- Variable Declarations (Optional: Can declare as needed)
-- =========================
-- We will declare variables just before they are assigned using LAST_INSERT_ID() or SELECT INTO.

-- =========================
-- Independent Tables & Lookups from Seed Data
-- =========================

-- --- Roles (Seed data exists) ---
SELECT RoleID INTO @role_super_admin FROM Roles WHERE RoleName = 'super_admin';
SELECT RoleID INTO @role_admin FROM Roles WHERE RoleName = 'admin';
SELECT RoleID INTO @role_event_organizer FROM Roles WHERE RoleName = 'event_organizer';
SELECT RoleID INTO @role_participant FROM Roles WHERE RoleName = 'participant';
SELECT RoleID INTO @role_sponsor FROM Roles WHERE RoleName = 'sponsor';
SELECT RoleID INTO @role_judge FROM Roles WHERE RoleName = 'judge';
-- Add any new roles if needed
INSERT INTO Roles (RoleName) VALUES ('volunteer');
SET @role_volunteer = LAST_INSERT_ID();

-- --- EventCategories (Seed data exists) ---
SELECT CategoryID INTO @cat_technical FROM EventCategories WHERE CategoryName = 'Technical';
SELECT CategoryID INTO @cat_business FROM EventCategories WHERE CategoryName = 'Business';
SELECT CategoryID INTO @cat_cultural FROM EventCategories WHERE CategoryName = 'Cultural';
SELECT CategoryID INTO @cat_sports FROM EventCategories WHERE CategoryName = 'Sports';
-- Add subcategories and a generic category for payments
INSERT INTO EventCategories (CategoryName, Description, ParentCategoryID) VALUES
    ('Programming Contest', 'Algorithmic programming challenges', @cat_technical),
    ('Startup Pitch', 'Pitching business ideas to investors', @cat_business),
    ('Music Night', 'Live musical performances', @cat_cultural),
    ('Gaming Tournament', 'E-sports competitions', @cat_technical),
    ('Internal/Fee Processing', 'Category for internal tracking like workshop fees', NULL); -- New Category
SET @cat_prog_contest = LAST_INSERT_ID();
SET @cat_startup_pitch = @cat_prog_contest + 1;
SET @cat_music_night = @cat_prog_contest + 2;
SET @cat_gaming_tournament = @cat_prog_contest + 3;
SET @cat_internal_fees = @cat_prog_contest + 4; -- ID for the new category


-- --- SponsorshipLevels ---
INSERT INTO SponsorshipLevels (LevelName, DisplayOrder, DefaultDescription) VALUES
    ('Platinum', 1, 'Highest level of sponsorship with maximum visibility and benefits.'),
    ('Gold', 2, 'Significant sponsorship level with prominent recognition.'),
    ('Silver', 3, 'Mid-level sponsorship offering good visibility.'),
    ('Bronze', 4, 'Entry-level sponsorship.');
SET @level_platinum = LAST_INSERT_ID();
SET @level_gold = @level_platinum + 1;
SET @level_silver = @level_platinum + 2;
SET @level_bronze = @level_platinum + 3;

-- --- Venues ---
INSERT INTO Venues (Name, Address, Location, Capacity, Facilities, VenueType, Status, Equipment) VALUES
    ('Main Auditorium', '123 University Ave, Cityville', 'Building A, Ground Floor', 500, 'Projector, Sound System, Wi-Fi, Stage', 'Auditorium', 'Available', 'Microphones, Podium, Screen'),
    ('Computer Lab 1', '123 University Ave, Cityville', 'Building B, Room 201', 50, 'PCs, Projector, Wi-Fi', 'Lab', 'Available', '50 Desktop PCs, 1 Projector, Whiteboard'),
    ('Seminar Hall C', '456 College Rd, Townsville', 'Building C, 3rd Floor', 100, 'Projector, Whiteboard, Wi-Fi', 'Hall', 'Available', 'Projector, Screen, Chairs, Tables'),
    ('Sports Ground', '789 Campus Dr, Cityville', 'Outdoor Area', 1000, 'Open Space, Seating Area', 'Outdoor Space', 'Available', 'Goalposts, Scoreboard (basic)'),
    ('Virtual/Admin Venue', 'N/A', 'N/A', NULL, 'N/A', 'Other', 'Available', 'N/A'); -- Added for Fee Event
SET @venue_auditorium = LAST_INSERT_ID();
SET @venue_lab1 = @venue_auditorium + 1;
SET @venue_hall_c = @venue_auditorium + 2;
SET @venue_sports_ground = @venue_auditorium + 3;
SET @venue_virtual = @venue_auditorium + 4; -- ID for Virtual Venue

-- --- Accommodations ---
INSERT INTO Accommodations (Name, Location, Capacity, Availability, BudgetRange, Amenities) VALUES
    ('Hostel Block A', 'University Campus, Near Gate 1', 200, 'Available', 'Low', 'Shared Rooms, Common Washrooms, Wi-Fi (lobby)'),
    ('University Guest House', 'University Campus, Admin Block', 50, 'Available', 'Medium', 'Private Rooms, Attached Bath, AC, Wi-Fi'),
    ('Nearby Hotel ABC', '15 Market Street, Cityville', 80, 'Available', 'High', 'Private Rooms, AC, TV, Wi-Fi, Restaurant');
SET @accom_hostel_a = LAST_INSERT_ID();
SET @accom_guest_house = @accom_hostel_a + 1;
SET @accom_hotel_abc = @accom_hostel_a + 2;

-- --- InventoryItems ---
INSERT INTO InventoryItems (ItemName, Description, QuantityOnHand, Category, LocationStored, LowStockThreshold) VALUES
    ('NASCON T-Shirt (L)', 'Official Large T-Shirt', 150, 'Merchandise', 'Storage Room 1', 20),
    ('Laptop Projector', 'Standard Projector for presentations', 10, 'Equipment', 'AV Room', 2),
    ('Registration Desk Banner', 'Large Vinyl Banner for Reg Desk', 2, 'Supplies', 'Storage Room 2', 1),
    ('Water Bottles (Case)', 'Case of 24 water bottles', 50, 'Supplies', 'Pantry', 10);
SET @item_tshirt = LAST_INSERT_ID();
SET @item_projector = @item_tshirt + 1;
SET @item_banner = @item_tshirt + 2;
SET @item_water = @item_tshirt + 3;

-- =========================
-- Dependent Tables - Level 1 (Depend on above + Roles)
-- =========================

-- --- Users (Seed data exists, adding more + getting existing IDs) ---
-- Get existing seed user IDs
SELECT UserID INTO @user_super_admin FROM Users WHERE username = 'superadmin';
SELECT UserID INTO @user_admin FROM Users WHERE username = 'admin';
SELECT UserID INTO @user_organizer FROM Users WHERE username = 'organizer';
SELECT UserID INTO @user_participant FROM Users WHERE username = 'participant';
SELECT UserID INTO @user_sponsor_contact FROM Users WHERE username = 'sponsor';
SELECT UserID INTO @user_judge1 FROM Users WHERE username = 'judge';

-- Add new users
INSERT INTO Users (Name, Email, Password, Contact, University, City, username, RoleID, Status) VALUES
    ('Alice Wonderland', 'alice@example.com', 'hashed_password_abc', '111-222-3333', 'Tech University', 'Cityville', 'aliceW', @role_participant, 'active'),
    ('Bob The Builder', 'bob@example.com', 'hashed_password_def', '444-555-6666', 'City College', 'Townsville', 'bobB', @role_participant, 'active'),
    ('Charlie Chaplin', 'charlie@example.com', 'hashed_password_ghi', '777-888-9999', 'Arts Institute', 'Cityville', 'charlieC', @role_participant, 'active'),
    ('Diana Prince', 'diana@example.com', 'hashed_password_jkl', '123-456-7890', 'Metro University', 'Metropolis', 'dianaP', @role_event_organizer, 'active'),
    ('Judge Judy', 'judy@example.com', 'hashed_password_mno', NULL, 'Law School', 'Justice City', 'judge_judy', @role_judge, 'active');
SET @user_alice = LAST_INSERT_ID();
SET @user_bob = @user_alice + 1;
SET @user_charlie = @user_alice + 2;
SET @user_diana = @user_alice + 3;
SET @user_judge2 = @user_alice + 4;

-- --- Sponsors ---
INSERT INTO Sponsors (Name, ContactPerson, Email, Phone, Status, LogoURL, Website) VALUES
    ('Tech Solutions Inc.', 'Mr. Smith', 'smith@techsolutions.com', '555-1000', 'active', 'http://example.com/logos/techsol.png', 'http://techsolutions.com'),
    ('Global Bank Corp.', 'Ms. Jones', 'jones@globalbank.com', '555-2000', 'active', 'http://example.com/logos/globalbank.png', 'http://globalbank.com'),
    ('Local Coffee Co.', 'Mr. Bean', 'bean@localcoffee.com', '555-3000', 'potential', NULL, 'http://localcoffee.com');
SET @sponsor_tech = LAST_INSERT_ID();
SET @sponsor_bank = @sponsor_tech + 1;
SET @sponsor_coffee = @sponsor_tech + 2;

-- --- Events ---
INSERT INTO Events (Name, Date, Time, Reg_Fee, Max_Participants, Rules, EventDescription, OrganizerID, VenueID, CategoryID, EventType, RegistrationDeadline, Status) VALUES
    ('NASCON Programming Contest', '2025-05-15', '09:00:00', 500.00, 100, 'Standard ICPC rules apply.', 'Solve algorithmic problems against the clock.', @user_diana, @venue_lab1, @cat_prog_contest, 'Team', '2025-05-10 23:59:59', 'Published'),
    ('Startup Pitch Competition', '2025-05-16', '10:00:00', 1000.00, 50, '5-minute pitch, 5-minute Q&A.', 'Pitch your innovative business idea.', @user_organizer, @venue_hall_c, @cat_startup_pitch, 'Individual', '2025-05-11 23:59:59', 'Published'),
    ('Cultural Music Night', '2025-05-15', '19:00:00', 0.00, 500, 'Enjoy performances from various artists.', 'An evening of live music and cultural celebration.', @user_diana, @venue_auditorium, @cat_music_night, 'Individual', NULL, 'Published'),
    ('Gaming Tournament - FIFA', '2025-05-17', '11:00:00', 200.00, 64, 'Single elimination bracket.', 'Compete in the annual FIFA tournament.', @user_organizer, @venue_sports_ground, @cat_gaming_tournament, 'Individual', '2025-05-12 23:59:59', 'Draft'),
    -- Generic Event for Workshop Fees (Workaround)
    ('Workshop Fee Payment Event', CURDATE(), '00:00:01', 0.00, NULL, 'Internal Use Only', 'Placeholder event to link workshop payments', @user_admin, @venue_virtual, @cat_internal_fees, 'Individual', NULL, 'Completed');
SET @event_prog_contest = LAST_INSERT_ID();
SET @event_startup_pitch = @event_prog_contest + 1;
SET @event_music_night = @event_prog_contest + 2;
SET @event_gaming = @event_prog_contest + 3;
SET @event_workshop_fee = @event_prog_contest + 4; -- ID for Fee Event

-- --- Judges ---
INSERT INTO Judges (UserID, Specialization, Status) VALUES
    (@user_judge1, 'Software Engineering, Algorithms', 'active'),
    (@user_judge2, 'Business Strategy, Finance', 'active');
SET @judge1 = LAST_INSERT_ID();
SET @judge2 = @judge1 + 1;

-- --- Workshops ---
INSERT INTO Workshops (Title, Description, InstructorUserID, Date, Time, VenueID, Capacity, RegFee, Status) VALUES
    ('Intro to Python Programming', 'A beginner-friendly workshop on Python basics.', @user_diana, '2025-05-14', '14:00:00', @venue_hall_c, 40, 100.00, 'upcoming'),
    ('Advanced Web Development Techniques', 'Exploring modern frontend and backend frameworks.', @user_organizer, '2025-05-14', '09:00:00', @venue_hall_c, 30, 150.00, 'upcoming');
SET @workshop_python = LAST_INSERT_ID();
SET @workshop_webdev = @workshop_python + 1;

-- --- SponsorshipPackages ---
INSERT INTO SponsorshipPackages (LevelID, PackageName, Description, Benefits, Amount, Status) VALUES
    (@level_platinum, 'NASCON Platinum 2025', 'Top-tier sponsorship package.', 'Keynote mention, Largest logo on all materials, Booth space, 10 free passes', 500000.00, 'active'),
    (@level_gold, 'NASCON Gold 2025', 'Premium sponsorship package.', 'Logo on website and banners, Booth space, 5 free passes', 250000.00, 'active'),
    (@level_silver, 'NASCON Silver 2025', 'Mid-tier sponsorship package.', 'Logo on website, Mention in program, 2 free passes', 100000.00, 'active');
SET @package_platinum = LAST_INSERT_ID();
SET @package_gold = @package_platinum + 1;
SET @package_silver = @package_platinum + 2;

-- =========================
-- Dependent Tables - Level 2
-- =========================

-- --- SponsorshipContracts ---
INSERT INTO SponsorshipContracts (SponsorID, PackageID, CustomLevelID, ContractAmount, SignedDate, StartDate, EndDate, Status) VALUES
    (@sponsor_tech, @package_platinum, NULL, 500000.00, '2025-03-01', '2025-04-01', '2026-03-31', 'active'), -- Tech Solutions takes Platinum Package
    (@sponsor_bank, NULL, @level_silver, 90000.00, '2025-03-15', '2025-04-15', '2025-10-15', 'pending_payment'); -- Global Bank negotiates a custom Silver deal
SET @contract_tech = LAST_INSERT_ID();
SET @contract_bank = @contract_tech + 1;

-- --- Teams ---
INSERT INTO Teams (TeamName, EventID, LeaderID, Status) VALUES
    ('Code Crusaders', @event_prog_contest, @user_alice, 'active'), -- Alice leads a team for Prog Contest
    ('Syntax Ninjas', @event_prog_contest, @user_bob, 'active');  -- Bob leads another team for Prog Contest
SET @team_crusaders = LAST_INSERT_ID();
SET @team_ninjas = @team_crusaders + 1;

-- =========================
-- Dependent Tables - Level 3
-- =========================

-- --- TeamMembers ---
INSERT INTO TeamMembers (TeamID, UserID, Role, Status) VALUES
    (@team_crusaders, @user_alice, 'Leader', 'active'),    -- Alice in her own team
    (@team_crusaders, @user_charlie, 'Member', 'active'),  -- Charlie joins Alice's team
    (@team_ninjas, @user_bob, 'Leader', 'active');         -- Bob in his own team

-- --- Registrations ---
INSERT INTO Registrations (UserID, EventID, TeamID, Status, PaymentStatus, SpecialRequirements) VALUES
    -- Prog Contest Registrations (Team Based)
    (@user_alice, @event_prog_contest, @team_crusaders, 'pending', 'pending', NULL),
    (@user_charlie, @event_prog_contest, @team_crusaders, 'pending', 'pending', NULL),
    (@user_bob, @event_prog_contest, @team_ninjas, 'pending', 'pending', NULL),
    -- Individual Registrations
    (@user_bob, @event_startup_pitch, NULL, 'pending', 'pending', 'Need projector access'),
    (@user_alice, @event_music_night, NULL, 'confirmed', 'not_required', NULL), -- Free event
    (@user_charlie, @event_gaming, NULL, 'pending', 'pending', NULL),
    -- Generic Registration for Bob's Workshop Fee (Workaround)
    (@user_bob, @event_workshop_fee, NULL, 'pending', 'pending', 'Fee for Web Dev Workshop');
SET @reg_alice_prog = LAST_INSERT_ID();
SET @reg_charlie_prog = @reg_alice_prog + 1;
SET @reg_bob_prog = @reg_alice_prog + 2;
SET @reg_bob_pitch = @reg_alice_prog + 3;
SET @reg_alice_music = @reg_alice_prog + 4;
SET @reg_charlie_gaming = @reg_alice_prog + 5;
SET @reg_bob_workshop_fee = @reg_alice_prog + 6; -- ID for Bob's Workshop Fee Registration

-- --- WorkshopRegistrations ---
INSERT INTO WorkshopRegistrations (UserID, WorkshopID, Status, PaymentStatus) VALUES
    (@user_alice, @workshop_python, 'pending', 'pending'), -- Assume Python workshop is free or payment handled differently
    (@user_bob, @workshop_python, 'pending', 'pending'),
    (@user_bob, @workshop_webdev, 'pending', 'pending'); -- This requires payment, linked via @reg_bob_workshop_fee
SET @wreg_alice_python = LAST_INSERT_ID();
SET @wreg_bob_python = @wreg_alice_python + 1;
SET @wreg_bob_webdev = @wreg_alice_python + 2;

-- =========================
-- Dependent Tables - Level 4 (Payments, EventJudges, Scores, etc.)
-- =========================

-- --- Payments ---
-- Payment for Alice's Prog Contest Registration
INSERT INTO Payments (Amount, PaymentMethod, Status, TransactionID, Description, PayerUserID, RelatedRegistrationID, RelatedContractID) VALUES
(500.00, 'online_gateway', 'pending', CONCAT('txn_prog_', UUID()), 'Reg Fee Prog Contest - User Alice', @user_alice, @reg_alice_prog, NULL);
SET @payment_alice_prog = LAST_INSERT_ID();
-- Simulate payment completion triggering registration confirmation
UPDATE Payments SET Status = 'completed' WHERE PaymentID = @payment_alice_prog;
-- NOTE: The trigger ConfirmRegistrationOnPayment should automatically update Registrations table now.

-- Payment for Bob's Startup Pitch Registration
INSERT INTO Payments (Amount, PaymentMethod, Status, TransactionID, Description, PayerUserID, RelatedRegistrationID, RelatedContractID) VALUES
(1000.00, 'credit_card', 'completed', CONCAT('txn_pitch_', UUID()), 'Reg Fee Startup Pitch - User Bob', @user_bob, @reg_bob_pitch, NULL);
-- Trigger ConfirmRegistrationOnPayment runs automatically

-- Payment for Bank's Sponsorship Contract
INSERT INTO Payments (Amount, PaymentMethod, Status, TransactionID, Description, PayerUserID, RelatedRegistrationID, RelatedContractID) VALUES
(90000.00, 'bank_transfer', 'completed', CONCAT('txn_sponsor_', UUID()), 'Payment for Silver Sponsorship Contract', @user_sponsor_contact, NULL, @contract_bank);
-- Update contract status manually if needed (trigger doesn't cover this)
UPDATE SponsorshipContracts SET Status = 'active' WHERE ContractID = @contract_bank AND Status = 'pending_payment';

-- Payment for Bob's WebDev Workshop (Linked via generic registration)
INSERT INTO Payments (Amount, PaymentMethod, Status, TransactionID, Description, PayerUserID, RelatedRegistrationID, RelatedContractID) VALUES
(150.00, 'cash', 'completed', CONCAT('txn_wshop_', UUID()), 'Workshop Fee - Web Dev - User Bob', @user_bob, @reg_bob_workshop_fee, NULL);
-- Trigger should now confirm the generic registration @reg_bob_workshop_fee

-- --- EventJudges ---
INSERT INTO EventJudges (EventID, JudgeID, Status) VALUES
    (@event_prog_contest, @judge1, 'assigned'),
    (@event_startup_pitch, @judge2, 'assigned');

-- --- Scores ---
-- Score for Bob in Startup Pitch from Judge 2
INSERT INTO Scores (EventID, RegistrationID, JudgeID, Value, Comments) VALUES
    (@event_startup_pitch, @reg_bob_pitch, @judge2, 85.50, 'Good market analysis, presentation needs polish.');
-- Score for Alice in Prog Contest from Judge 1 (Team event, scoring individual registration)
INSERT INTO Scores (EventID, RegistrationID, JudgeID, Value, Comments) VALUES
    (@event_prog_contest, @reg_alice_prog, @judge1, 75.00, 'Solved 3 problems quickly.');

-- --- AccommodationRequests ---
INSERT INTO AccommodationRequests (UserID, CheckInDate, CheckOutDate, NumberOfPeople, Status, AssignedAccommodationID, AssignmentNotes) VALUES
    (@user_alice, '2025-05-14', '2025-05-18', 1, 'Pending', NULL, NULL),
    (@user_bob, '2025-05-15', '2025-05-18', 2, 'Approved', @accom_guest_house, 'Assigned to Guest House room 101');
SET @accreq_alice = LAST_INSERT_ID();
SET @accreq_bob = @accreq_alice + 1;

-- --- SystemAlerts ---
INSERT INTO SystemAlerts (UserID, TargetRoleID, AlertType, Message, RelatedEventID, RelatedItemID, IsRead) VALUES
    (@user_alice, NULL, 'EventReminder', CONCAT('Reminder: Your event "Cultural Music Night" is upcoming!'), @event_music_night, NULL, FALSE),
    (NULL, @role_admin, 'LowInventory', CONCAT('Low stock for Item ID: ', @item_tshirt), NULL, @item_tshirt, FALSE),
    (NULL, NULL, 'System', 'Database backup completed successfully.', NULL, NULL, TRUE);

-- --- ContactInquiries ---
INSERT INTO ContactInquiries (Name, Email, Subject, Message, Status) VALUES
    ('Curious George', 'george@email.com', 'Question about Event Schedule', 'Where can I find the final schedule for workshops?', 'Pending'),
    ('Feedback Fiona', 'fiona@email.com', 'Website Feedback', 'The registration process was very smooth!', 'Resolved');

-- --- RolePrivileges (Example specific privileges) ---
-- Clear existing demo privileges if necessary before adding specific ones
-- DELETE FROM RolePrivileges;
INSERT IGNORE INTO RolePrivileges (RoleID, Resource, Action) VALUES
    -- Super Admin (Full access assumed by app logic or GRANTs, defining specifics is good practice)
    (@role_super_admin, 'Users', 'create'), (@role_super_admin, 'Users', 'read'), (@role_super_admin, 'Users', 'update'), (@role_super_admin, 'Users', 'delete'),
    (@role_super_admin, 'Events', 'create'), (@role_super_admin, 'Events', 'read'), (@role_super_admin, 'Events', 'update'), (@role_super_admin, 'Events', 'delete'),
    (@role_super_admin, 'Roles', 'manage'), (@role_super_admin, 'Privileges', 'manage'),
    -- Admin
    (@role_admin, 'Events', 'read'), (@role_admin, 'Events', 'update'), (@role_admin, 'Registrations', 'read'), (@role_admin, 'Users', 'read'), (@role_admin, 'Users', 'update'), (@role_admin, 'Venues', 'manage'),
    -- Event Organizer
    (@role_event_organizer, 'Events', 'create'), (@role_event_organizer, 'Events', 'read'), (@role_event_organizer, 'Events', 'update'), -- Specific organizer might only manage their own events (needs app logic)
    (@role_event_organizer, 'Registrations', 'read'), -- (for own events)
    (@role_event_organizer, 'Judges', 'assign'), -- Custom action example
    -- Participant
    (@role_participant, 'Events', 'read'), (@role_participant, 'Registrations', 'create'), (@role_participant, 'Registrations', 'read'), -- (own registrations)
    (@role_participant, 'Teams', 'create'), (@role_participant, 'Teams', 'read'), (@role_participant, 'TeamMembers', 'manage'), -- (own teams)
    (@role_participant, 'Users', 'read_self'), (@role_participant, 'Users', 'update_self'),
    -- Judge
    (@role_judge, 'Events', 'read'), -- (assigned events)
    (@role_judge, 'Scores', 'create'), (@role_judge, 'Scores', 'read'), (@role_judge, 'Scores', 'update'), -- (for assigned events)
    (@role_judge, 'Registrations', 'read'); -- (for assigned events)

-- Re-enable FK checks if disabled earlier
-- SET FOREIGN_KEY_CHECKS=1;

-- =========================
-- END OF DUMMY DATA
-- =========================

SELECT 'Dummy data insertion complete (v2).' AS Status;

-- Example: Event participant rankings (using new Scores schema)
-- This query shows total and average scores for each participant in an event:
SELECT 
    u.UserID as ParticipantUserID,
    u.Name as ParticipantName,
    COUNT(DISTINCT s.JudgeID) as JudgeCount,
    SUM(s.Value) as TotalScore,
    AVG(s.Value) as AverageScore
FROM Users u
JOIN Registrations r ON u.UserID = r.UserID
LEFT JOIN Scores s ON r.RegistrationID = s.RegistrationID
WHERE r.EventID = 1 -- Replace with your EventID
GROUP BY u.UserID
ORDER BY TotalScore DESC, AverageScore DESC;
```

## .\src\app.js

```js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');
const passport = require('./config/passport');
const { notification } = require('./middleware/notification');
const { isAuthenticated, hasPrivilege, populatePrivileges } = require('./middleware/auth');
require('dotenv').config();

const app = express();

// Import routes
const eventsRouter = require('./routes/events');
const sponsorsRouter = require('./routes/sponsors');
const aboutRouter = require('./routes/about');
const competitionsRouter = require('./routes/competitions');
const workshopsRouter = require('./routes/workshops');
const registrationRouter = require('./routes/registration');
const accommodationsRouter = require('./routes/accommodations');
const loginRouter = require('./routes/login');
const authRoutes = require('./routes/auth');
const contactRouter = require('./routes/contact');
const faqRoutes = require('./routes/faq');
const scheduleRouter = require('./routes/schedule');
const indexRouter = require('./routes/index');
const paymentsRouter = require('./routes/payments');
const venuesRouter = require('./routes/venues');
const categoriesRouter = require('./routes/categories');
const teamsRouter = require('./routes/teams');
const judgesRouter = require('./routes/judges');
const scoresRouter = require('./routes/scores');

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Populate user privileges for all requests
app.use(populatePrivileges);

// Add notification middleware
app.use(notification);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        title: 'NASCON - Home',
        user: req.session.user || null
    });
});

// Public routes
app.use('/auth', require('./routes/auth'));
app.use('/register', require('./routes/registration'));
app.use('/login', loginRouter);
app.use('/public', express.static(path.join(__dirname, 'public')));

// Require authentication for all other routes
app.use(isAuthenticated);

// Protected routes
app.use('/events', hasPrivilege('Events', 'read'), require('./routes/events'));
app.use('/venues', hasPrivilege('Venues', 'read'), require('./routes/venues'));
app.use('/sponsors', hasPrivilege('Sponsors', 'read'), require('./routes/sponsors'));
app.use('/accommodations', hasPrivilege('Accommodations', 'read'), require('./routes/accommodations'));
app.use('/payments', hasPrivilege('Payments', 'read'), require('./routes/payments'));
app.use('/judges', hasPrivilege('Judges', 'read'), require('./routes/judges'));
app.use('/scores', hasPrivilege('Scores', 'read'), require('./routes/scores'));

// Page Routes
app.use('/about', aboutRouter);
app.use('/competitions', competitionsRouter);
app.use('/workshops', workshopsRouter);
app.use('/contact', contactRouter);
app.use('/faq', faqRoutes);
app.use('/schedule', scheduleRouter);
app.use('/categories', categoriesRouter);
app.use('/teams', teamsRouter);
app.use('/', indexRouter);

// API Routes
app.use('/api/events', eventsRouter);
app.use('/api/sponsors', sponsorsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/venues', venuesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).render('error', {
        title: 'Error',
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {},
        user: req.user || null
    });
});

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 Not Found',
        message: 'The page you are looking for does not exist.',
        error: {},
        user: req.user || null
    });
});

const PORT = process.env.PORT || 3000;

const startServer = () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
            process.env.PORT = PORT + 1;
            startServer();
        } else {
            console.error('Error starting server:', error);
        }
    }
};

startServer();

module.exports = app; 
```

## .\src\config\database.js

```js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
    console.warn('Using default values. This is not recommended for production.');
}

console.log('Database configuration:', {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'NASCON',
    // Don't log the password for security reasons
});

// Create connection pool with improved settings
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'NASCON',
    waitForConnections: true,
    connectionLimit: 20, // Increased for better performance
    queueLimit: 0,
    enableKeepAlive: true, // Enable keep-alive
    keepAliveInitialDelay: 10000, // 10 seconds
    namedPlaceholders: true, // Enable named placeholders
    timezone: 'Z', // Use UTC timezone
    charset: 'utf8mb4', // Use UTF-8
    collation: 'utf8mb4_unicode_ci' // Use Unicode collation
});

// Test database connection and create database if it doesn't exist
async function initializeDatabase() {
    let connection;
    try {
        console.log('Attempting to connect to database...');
        connection = await pool.getConnection();
        console.log('Database connected successfully');
        
        // Create database if it doesn't exist
        console.log('Creating database if it doesn\'t exist...');
        await connection.query('CREATE DATABASE IF NOT EXISTS NASCON');
        await connection.query('USE NASCON');
        
        // Test query to ensure database is working
        console.log('Testing database connection...');
        await connection.query('SELECT 1');
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error connecting to the database:', err);
        console.error('Error details:', {
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage
        });
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Please check your database credentials.');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('Connection refused. Please check if the database server is running.');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('Database does not exist. Please create it first.');
        }
        throw err;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Initialize database
initializeDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1); // Exit if database initialization fails
});

// Helper function to execute queries with improved error handling
async function executeQuery(query, params = []) {
    let connection;
    try {
        console.log('Executing query:', query);
        console.log('Query parameters:', params);
        connection = await pool.getConnection();
        const [results] = await connection.execute(query, params);
        console.log('Query executed successfully');
        return results;
    } catch (error) {
        console.error('Database query error:', error);
        console.error('Error details:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        
        // Handle specific database errors
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Duplicate entry found');
        } else if (error.code === 'ER_NO_REFERENCED_ROW') {
            throw new Error('Referenced record does not exist');
        } else if (error.code === 'ER_DATA_TOO_LONG') {
            throw new Error('Data too long for column');
        } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
            throw new Error('Invalid data type');
        } else if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            throw new Error('Database lock timeout');
        } else if (error.code === 'ER_LOCK_DEADLOCK') {
            throw new Error('Database deadlock detected');
        }
        
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Helper function to execute transactions
async function executeTransaction(queries) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        
        const results = [];
        for (const { query, params } of queries) {
            console.log('Executing transaction query:', query);
            console.log('Query parameters:', params);
            const [result] = await connection.execute(query, params);
            results.push(result);
        }
        
        await connection.commit();
        console.log('Transaction committed successfully');
        return results;
    } catch (error) {
        console.error('Transaction error:', error);
        if (connection) {
            await connection.rollback();
            console.log('Transaction rolled back');
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    pool,
    executeQuery,
    executeTransaction
};
```

## .\src\config\passport.js

```js
const passport = require('passport');
const { executeQuery } = require('./database');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

passport.serializeUser((user, done) => {
    done(null, user.UserID);
});

passport.deserializeUser(async (id, done) => {
    try {
        const query = `
            SELECT u.UserID, u.Name, u.Email, u.username, u.RoleID, r.RoleName as Role
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.UserID = ?
        `;
        const users = await executeQuery(query, [id]);
        
        if (users.length === 0) {
            return done(null, false);
        }
        
        const user = users[0];
        // Load privileges from RolePrivileges and UserPrivileges
        const rolePrivs = await executeQuery(
            'SELECT Resource, Action FROM RolePrivileges WHERE RoleID = ?',
            [user.RoleID]
        );
        const userPrivs = await executeQuery(
            'SELECT Resource, Action FROM UserPrivileges WHERE UserID = ?',
            [user.UserID]
        );
        // Merge privileges into a nested object: { Resource: { action: true } }
        user.privileges = {};
        for (const priv of rolePrivs.concat(userPrivs)) {
            if (!user.privileges[priv.Resource]) user.privileges[priv.Resource] = {};
            user.privileges[priv.Resource][priv.Action] = true;
        }
        console.log('DEBUG: Loaded privileges for user', user.UserID, ':', user.privileges);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Register the local strategy
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const query = `
            SELECT u.UserID, u.Name, u.Email, u.Password, u.username, u.RoleID, r.RoleName as Role
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.Email = ?
        `;
        const users = await executeQuery(query, [email]);
        if (users.length === 0) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.Password);
        if (!passwordMatch) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        // Load privileges after login
        const rolePrivs = await executeQuery(
            'SELECT Resource, Action FROM RolePrivileges WHERE RoleID = ?',
            [user.RoleID]
        );
        let userPrivs = [];
        try {
            userPrivs = await executeQuery(
                'SELECT Resource, Action FROM UserPrivileges WHERE UserID = ?',
                [user.UserID]
            );
        } catch (e) { userPrivs = []; }
        user.privileges = {};
        for (const priv of rolePrivs.concat(userPrivs)) {
            if (!user.privileges[priv.Resource]) user.privileges[priv.Resource] = {};
            user.privileges[priv.Resource][priv.Action] = true;
        }
        console.log('DEBUG: Loaded privileges after login for user', user.UserID, ':', user.privileges);
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

module.exports = passport;
```

## .\src\middleware\auth.js

```js
const { executeQuery } = require('../config/database');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

// Middleware to check if user is a judge
const isJudge = async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const query = `
            SELECT j.JudgeID, j.Status
            FROM Judges j
            WHERE j.UserID = ?
        `;
        const result = await executeQuery(query, [req.user.UserID]);
        
        if (result.length > 0 && result[0].Status === 'active') {
            req.judgeId = result[0].JudgeID;
            return next();
        }
        
        res.status(403).json({ error: 'Forbidden - User is not an active judge' });
    } catch (error) {
        console.error('Error checking judge status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Middleware to check user privileges
const hasPrivilege = (resource, action = 'create') => {
    return (req, res, next) => {
        if (!req.user || !req.user.privileges) {
            return res.status(403).json({ error: 'Access denied: No privileges found.' });
        }
        // Normalize resource/action
        const resKey = resource.charAt(0).toUpperCase() + resource.slice(1);
        const actKey = action.toLowerCase();
        // Example: req.user.privileges.Events.create === true
        if (
            req.user.privileges[resKey] &&
            req.user.privileges[resKey][actKey]
        ) {
            return next();
        }
        return res.status(403).json({ error: `Access denied: Missing privilege for ${resource}.${action}` });
    };
};

// Middleware to check if user has admin role
const isAdmin = async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const query = `
            SELECT RoleName
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.UserID = ?
        `;
        const result = await executeQuery(query, [req.user.UserID]);
        
        if (result[0].RoleName === 'admin') {
            return next();
        }
        
        res.status(403).json({ error: 'Forbidden' });
    } catch (error) {
        console.error('Error checking admin role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// middleware/auth.js
function requireRole(roleName) {
    return function (req, res, next) {
      if (!req.session.user || req.session.user.role !== roleName) {
        return res.status(403).send('Forbidden');
      }
      next();
    }
  }

// Middleware to populate req.user.privileges from DB (if not already)
async function populatePrivileges(req, res, next) {
    if (req.user && !req.user.privileges) {
        try {
            const { executeQuery } = require('../config/database');
            const rows = await executeQuery(
                'SELECT Resource, Action FROM RolePrivileges WHERE RoleID = ?',
                [req.user.RoleID]
            );
            req.user.privileges = {};
            for (const row of rows) {
                if (!req.user.privileges[row.Resource]) req.user.privileges[row.Resource] = {};
                req.user.privileges[row.Resource][row.Action] = true;
            }
        } catch (err) {
            console.error('Error populating privileges:', err);
            req.user.privileges = {};
        }
    }
    next();
}

module.exports = {
    isAuthenticated,
    hasPrivilege,
    isAdmin,
    requireRole,
    isJudge,
    populatePrivileges
}; 
```

## .\src\middleware\notification.js

```js
// Notification middleware
function notification(req, res, next) {
    // Get notification from session and clear it
    res.locals.notification = req.session.notification;
    delete req.session.notification;
    next();
}

// Helper function to set notification
function setNotification(req, message, type = 'info') {
    req.session.notification = { message, type };
}

module.exports = {
    notification,
    setNotification
}; 
```

## .\src\middleware\validation.js

```js
const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// User registration validation rules
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .isLength({ max: 50 }).withMessage('Email must not exceed 50 characters')
        .normalizeEmail(),
    
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 255 }).withMessage('Username must be between 3 and 255 characters')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores and hyphens'),
    
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    
    body('contact')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Contact number must not exceed 20 characters')
        .matches(/^\+?[\d\s-]{10,}$/).withMessage('Invalid phone number format'),
    
    body('roleId')
        .notEmpty().withMessage('Role is required')
        .isInt().withMessage('Invalid role ID'),

    validate
];

// Event creation validation rules
const eventValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Event name is required')
        .isLength({ min: 3, max: 100 }).withMessage('Event name must be between 3 and 100 characters'),
    
    body('date')
        .trim()
        .notEmpty().withMessage('Event date is required')
        .isISO8601().withMessage('Invalid date format')
        .custom((value) => {
            const eventDate = new Date(value);
            if (eventDate < new Date()) {
                throw new Error('Event date cannot be in the past');
            }
            return true;
        }),
    
    body('time')
        .trim()
        .notEmpty().withMessage('Event time is required')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
    
    body('Reg_Fee')
        .optional()
        .isFloat({ min: 0 }).withMessage('Registration fee must be a non-negative number'),
    
    body('Max_Participants')
        .optional()
        .isInt({ min: 1 }).withMessage('Maximum participants must be a positive number'),
    
    body('Rules')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Rules must not exceed 1000 characters'),
    
    body('EventDescription')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Event description must not exceed 2000 characters'),
    
    body('VenueID')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid venue ID'),
    
    body('CategoryID')
        .notEmpty().withMessage('Category is required')
        .isInt({ min: 1 }).withMessage('Invalid category ID'),
    
    body('EventType')
        .trim()
        .notEmpty().withMessage('Event type is required')
        .isIn(['Individual', 'Team', 'Both']).withMessage('Invalid event type'),
    
    body('RegistrationDeadline')
        .trim()
        .notEmpty().withMessage('Registration deadline is required')
        .isISO8601().withMessage('Invalid date format')
        .custom((value, { req }) => {
            const deadline = new Date(value);
            const eventDate = new Date(req.body.date);
            if (deadline >= eventDate) {
                throw new Error('Registration deadline must be before event date');
            }
            return true;
        }),
    
    body('Status')
        .optional()
        .trim()
        .isIn(['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled']).withMessage('Invalid status'),
    
    validate
];

module.exports = {
    registerValidation,
    eventValidation
}; 
```

## .\src\middleware\venueValidation.js

```js
const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Venue validation rules
const venueValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Venue name is required')
        .isLength({ max: 100 }).withMessage('Venue name must not exceed 100 characters'),
    
    body('address')
        .trim()
        .notEmpty().withMessage('Address is required')
        .isLength({ max: 255 }).withMessage('Address must not exceed 255 characters'),
    
    body('location')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Location must not exceed 255 characters'),
    
    body('capacity')
        .optional()
        .isInt({ min: 1 }).withMessage('Capacity must be a positive number'),
    
    body('availability')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Availability must not exceed 50 characters'),
    
    body('facilities')
        .optional()
        .trim(),
    
    body('mapEmbedURL')
        .optional()
        .trim(),
    
    body('description')
        .optional()
        .trim(),
    
    body('contactPerson')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Contact person name must not exceed 100 characters'),
    
    body('contactEmail')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format')
        .isLength({ max: 100 }).withMessage('Contact email must not exceed 100 characters'),
    
    body('contactPhone')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Contact phone must not exceed 20 characters')
        .matches(/^\+?[\d\s-]{10,}$/).withMessage('Invalid phone number format'),
    
    body('venueType')
        .trim()
        .notEmpty().withMessage('Venue type is required')
        .isIn(['Auditorium', 'Hall', 'Lab', 'Outdoor Space']).withMessage('Invalid venue type'),
    
    body('status')
        .optional()
        .trim()
        .isIn(['Available', 'Under Maintenance', 'Unavailable']).withMessage('Invalid status'),
    
    body('equipment')
        .optional()
        .trim(),
    
    body('restrictions')
        .optional()
        .trim(),
    
    validate
];

module.exports = {
    venueValidation
}; 
```

## .\src\public\js\competitions.js

```js
document.addEventListener('DOMContentLoaded', () => {
    const categoryFilter = document.getElementById('categoryFilter');
    const competitionsGrid = document.getElementById('competitionsGrid');
    const noResultsMessage = document.getElementById('noResultsCompMessage');

    // --- Filtering Logic ---
    function filterCompetitions() {
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        const cards = competitionsGrid ? competitionsGrid.querySelectorAll('.competition-card-wrapper') : [];
        let visibleCount = 0;

        cards.forEach(card => {
            const cardCategory = card.dataset.category || '';
            const isVisible = !selectedCategory || cardCategory === selectedCategory;

            // Animate filtering (optional)
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            if (isVisible) {
                card.style.display = '';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
                visibleCount++;
            } else {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                // Use setTimeout to hide after animation
                setTimeout(() => { card.style.display = 'none'; }, 300);
            }
        });

        // Show/hide no results message
        if (noResultsMessage) {
            noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    // Add event listener for category filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterCompetitions);
    }

    // --- Modal Handling Logic ---
    const registrationModalElement = document.getElementById('registrationModal');
    let registrationModalInstance = null;
    if (registrationModalElement) {
        registrationModalInstance = new bootstrap.Modal(registrationModalElement);
    }
    const modalEventNameElement = document.getElementById('modalEventName');
    const confirmRegistrationBtn = document.getElementById('confirmRegistrationBtn');
    let currentEventIdForModal = null;

    // Add event listeners to all register buttons
    competitionsGrid.addEventListener('click', (event) => {
        if (event.target.classList.contains('register-btn') || event.target.closest('.register-btn')) {
            const button = event.target.closest('.register-btn');
            currentEventIdForModal = button.dataset.eventId;
            if (modalEventNameElement) {
                modalEventNameElement.textContent = button.dataset.eventName || 'this competition';
            }
            if (registrationModalInstance) {
                registrationModalInstance.show();
            } else {
                console.error("Registration modal instance not found");
            }
        }
    });

    // Handle confirm registration button click
    if (confirmRegistrationBtn) {
        confirmRegistrationBtn.addEventListener('click', async () => {
            if (!currentEventIdForModal) {
                alert('Error: No event selected.');
                return;
            }

            // --- !!! Replace this alert with your actual API call !!! ---
            console.log(`Attempting to register for event ID: ${currentEventIdForModal}`);
            alert(`Placeholder: Registration confirmed for event ID ${currentEventIdForModal}. Implement actual API call.`);
            // Example API call structure:
            /*
            try {
                const response = await fetch('/api/register-event', { // Adjust endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add authorization headers if needed
                    },
                    body: JSON.stringify({ eventId: currentEventIdForModal })
                });

                if (response.ok) {
                    alert('Registration successful!');
                    if (registrationModalInstance) registrationModalInstance.hide();
                    // Optionally update UI or redirect
                } else {
                    const errorData = await response.json();
                    alert(`Registration failed: ${errorData.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Registration API call failed:', error);
                alert('An error occurred during registration.');
            }
            */
            // --- End of API call placeholder ---

            if (registrationModalInstance) registrationModalInstance.hide();
        });
    }

    // Initial filter on page load
    if (competitionsGrid) { // Check if the grid exists before filtering
        filterCompetitions();
    } else {
        console.warn("Competitions grid not found on this page.");
    }
});

```

## .\src\public\js\header.js

```js
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    // Scroll effect
    const header = document.querySelector('.main-nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('active') && 
            !e.target.closest('.nav-links') && 
            !e.target.closest('.mobile-menu-btn')) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });

    // Add smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu after clicking
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    });
}); 
```

## .\src\public\js\login.js

```js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const errorAlert = document.getElementById('errorAlert');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').classList.toggle('fa-eye');
            togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Handle form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorAlert.classList.add('d-none');
            
            // Basic form validation
            if (!form.checkValidity()) {
                e.stopPropagation();
                form.classList.add('was-validated');
                return;
            }

            try {
                console.log('Submitting login form...');
                const formData = {
                    email: form.email.value,
                    password: form.password.value
                };
                console.log('Form data:', { ...formData, password: '***' });

                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                // Redirect to dashboard or home page
                window.location.href = data.redirect || '/dashboard';
            } catch (error) {
                console.error('Login error:', error);
                errorAlert.textContent = error.message;
                errorAlert.classList.remove('d-none');
            }
        });
    }

    // Check for registration success message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        const successAlert = document.getElementById('successAlert');
        if (successAlert) {
            successAlert.classList.remove('d-none');
            setTimeout(() => {
                successAlert.classList.add('d-none');
            }, 5000);
        }
    }
}); 
```

## .\src\public\js\main.js

```js
// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-container')) {
            if (navLinks && window.innerWidth <= 768) {
                navLinks.style.display = 'none';
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.style.display = 'flex';
        } else {
            navLinks.style.display = 'none';
        }
    });
});

// Fetch Featured Events
async function fetchFeaturedEvents() {
    try {
        const response = await fetch('/api/events/featured');
        const events = await response.json();
        displayFeaturedEvents(events);
    } catch (error) {
        console.error('Error fetching featured events:', error);
    }
}

// Display Featured Events
function displayFeaturedEvents(events) {
    const eventsGrid = document.querySelector('.events-grid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = events.map(event => `
        <div class="event-card">
            <img src="${event.imageUrl || '/images/default-event.jpg'}" alt="${event.name}">
            <div class="event-content">
                <h3>${event.name}</h3>
                <p>${event.description}</p>
                <div class="event-details">
                    <span><i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleDateString()}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${event.venue}</span>
                </div>
                <a href="/events/${event.id}" class="btn btn-primary">Learn More</a>
            </div>
        </div>
    `).join('');
}

// Fetch Sponsors
async function fetchSponsors() {
    try {
        const response = await fetch('/api/sponsors');
        const sponsors = await response.json();
        displaySponsors(sponsors);
    } catch (error) {
        console.error('Error fetching sponsors:', error);
    }
}

// Display Sponsors
function displaySponsors(sponsors) {
    const sponsorsGrid = document.querySelector('.sponsors-grid');
    if (!sponsorsGrid) return;

    sponsorsGrid.innerHTML = sponsors.map(sponsor => `
        <div class="sponsor-card">
            <img src="${sponsor.logoUrl || '/images/default-sponsor.png'}" alt="${sponsor.name}">
            <h3>${sponsor.name}</h3>
            <p>${sponsor.category}</p>
        </div>
    `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedEvents();
    fetchSponsors();
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Dark Mode Toggle
const darkModeToggle = document.createElement('button');
darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
darkModeToggle.className = 'dark-mode-toggle';
document.body.appendChild(darkModeToggle);

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = darkModeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
});

// Add dark mode toggle styles
const style = document.createElement('style');
style.textContent = `
    .dark-mode-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-color);
        color: var(--white);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        box-shadow: var(--shadow);
    }

    .dark-mode-toggle:hover {
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);

// Notification Bar Navigation
document.addEventListener('DOMContentLoaded', () => {
    const notificationItems = document.querySelectorAll('.notification-item');
    
    notificationItems.forEach(item => {
        item.addEventListener('click', () => {
            const text = item.querySelector('span').textContent.toLowerCase();
            switch(text) {
                case 'schedule':
                    window.location.href = '/schedule';
                    break;
                case 'competitions':
                    window.location.href = '/competitions';
                    break;
                case 'sponsors':
                    window.location.href = '/sponsors';
                    break;
                case 'workshops':
                    window.location.href = '/workshops';
                    break;
                case 'accommodations':
                    window.location.href = '/accommodations';
                    break;
            }
        });
    });
}); 
```

## .\src\public\js\registration.js

```js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const errorAlert = document.getElementById('errorAlert');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorAlert.classList.add('d-none');
        
        // Basic form validation
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        try {
            console.log('Submitting registration form...');
            const formData = {
                name: form.name.value,
                email: form.email.value,
                username: form.username.value,
                password: form.password.value,
                contact: form.contact.value,
                roleId: parseInt(form.roleId.value)
            };
            console.log('Form data:', formData);

            const response = await fetch('/register/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Registration failed');
            }

            // Show success popup
            const overlay = document.getElementById('overlay');
            const successPopup = document.getElementById('successPopup');
            overlay.classList.add('show');
            successPopup.classList.add('show');

            // Redirect to login page after 3 seconds
            setTimeout(() => {
                window.location.href = '/login?registered=true';
            }, 3000);
        } catch (error) {
            console.error('Registration error:', error);
            errorAlert.textContent = error.message;
            errorAlert.classList.remove('d-none');
        }
    });
}); 
```

## .\src\routes\about.js

```js
const express = require('express');
const router = express.Router();

// GET /about
router.get('/', (req, res) => {
    res.render('about', {
        title: 'About NASCON',
        user: req.session.user || null
    });
});

module.exports = router; 
```

## .\src\routes\accommodations.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/accommodations')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// GET /accommodations - render accommodations page
router.get('/', async (req, res) => {
    try {
        // Fetch accommodations from database
        const accommodationsQuery = `
            SELECT 
                AccommodationID,
                Name,
                Location,
                Capacity,
                Availability,
                BudgetRange,
                PhotoURLs,
                Description,
                Amenities,
                ContactInfo
            FROM Accommodations
            WHERE Availability != 'Unavailable'
            ORDER BY Capacity DESC
        `;
        const accommodations = await executeQuery(accommodationsQuery);
        
        // Fetch venues from database
        const venuesQuery = `
            SELECT 
                VenueID,
                Name,
                Address,
                Location,
                Capacity,
                Facilities,
                MapEmbedURL,
                Description,
                ContactPerson,
                ContactEmail,
                ContactPhone,
                VenueType,
                Status,
                Equipment
            FROM Venues
            WHERE Status = 'Available'
            ORDER BY Capacity DESC
        `;
        const venues = await executeQuery(venuesQuery);

        res.render('accommodations', {
            title: 'Accommodations & Venues',
            accommodations: accommodations,
            venues: venues,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching accommodations:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading accommodations and venues',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.user
        });
    }
});

// POST /api/accommodations/request - Request accommodation
router.post('/api/accommodations/request', async (req, res) => {
    try {
        const { participantId, numberOfPeople, budget, checkIn, checkOut } = req.body;

        // Validate request
        if (!participantId || !numberOfPeople || !budget || !checkIn || !checkOut) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find suitable accommodation based on criteria
        const findAccommodationQuery = `
            SELECT AccommodationID, Name, Capacity, BudgetRange
            FROM Accommodations
            WHERE Availability = 'Available'
            AND Capacity >= ?
            AND CAST(SUBSTRING_INDEX(BudgetRange, '-', -1) AS DECIMAL) <= ?
            ORDER BY ABS(Capacity - ?) ASC, CAST(SUBSTRING_INDEX(BudgetRange, '-', 1) AS DECIMAL) ASC
            LIMIT 1
        `;
        const accommodations = await executeQuery(findAccommodationQuery, [numberOfPeople, budget, numberOfPeople]);

        if (accommodations.length === 0) {
            return res.status(404).json({ error: 'No suitable accommodation found' });
        }

        const accommodation = accommodations[0];

        // Create accommodation request
        const createRequestQuery = `
            INSERT INTO AccommodationRequests (
                ParticipantID,
                AccommodationID,
                NumberOfPeople,
                Budget,
                CheckInDate,
                CheckOutDate,
                Status
            ) VALUES (?, ?, ?, ?, ?, ?, 'Pending')
        `;
        const result = await executeQuery(createRequestQuery, [
            participantId,
            accommodation.AccommodationID,
            numberOfPeople,
            budget,
            checkIn,
            checkOut
        ]);

        res.status(201).json({
            message: 'Accommodation request created successfully',
            requestId: result.insertId,
            accommodation: accommodation
        });
    } catch (error) {
        console.error('Error creating accommodation request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/accommodations/requests/:participantId - Get participant's requests
router.get('/api/accommodations/requests/:participantId', async (req, res) => {
    try {
        const requests = await executeQuery(`
            SELECT 
                ar.*,
                a.Name as AccommodationName,
                a.Location,
                a.BudgetRange
            FROM AccommodationRequests ar
            JOIN Accommodations a ON ar.AccommodationID = a.AccommodationID
            WHERE ar.ParticipantID = ?
            ORDER BY ar.RequestDate DESC
        `, [req.params.participantId]);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching accommodation requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/accommodations/reports/allocation - Generate room allocation report
router.get('/api/accommodations/reports/allocation', async (req, res) => {
    try {
        const report = await executeQuery(`
            SELECT 
                a.Name as AccommodationName,
                a.Location,
                a.Capacity,
                COUNT(ar.RequestID) as TotalRequests,
                SUM(ar.NumberOfPeople) as TotalPeopleAllocated,
                a.Capacity - SUM(COALESCE(ar.NumberOfPeople, 0)) as RemainingCapacity,
                GROUP_CONCAT(DISTINCT 
                    CASE 
                        WHEN ar.Status = 'Approved' 
                        THEN CONCAT(p.Name, ' (', ar.NumberOfPeople, ' people)')
                        END
                    SEPARATOR ', ') as AllocatedParticipants
            FROM Accommodations a
            LEFT JOIN AccommodationRequests ar ON a.AccommodationID = ar.AccommodationID
            LEFT JOIN Participants p ON ar.ParticipantID = p.ParticipantID
            GROUP BY a.AccommodationID
            ORDER BY a.Name ASC
        `);
        res.json(report);
    } catch (error) {
        console.error('Error generating allocation report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /accommodations/add - Show accommodation form
router.get('/add', (req, res) => {
    res.render('accommodation-form', {
        title: 'Add New Accommodation',
        user: req.session.user || null
    });
});

// POST /accommodations/add - Handle accommodation form submission
router.post('/add', upload.array('photos', 5), async (req, res) => {
    try {
        console.log('Form submission received:', req.body);
        console.log('Files received:', req.files);

        const {
            name,
            location,
            capacity,
            availability,
            budgetRange,
            description,
            contactInfo
        } = req.body;

        // Get amenities as a comma-separated string
        let amenities = '';
        if (Array.isArray(req.body.amenities)) {
            amenities = req.body.amenities.join(', ');
        } else if (typeof req.body.amenities === 'string') {
            amenities = req.body.amenities;
        }

        // Get photo URLs
        const photoURLs = req.files ? req.files.map(file => `/uploads/accommodations/${file.filename}`).join(',') : '';

        console.log('Processed data:', {
            name,
            location,
            capacity,
            availability,
            budgetRange,
            description,
            contactInfo,
            amenities,
            photoURLs
        });

        // Insert into database
        const query = `
            INSERT INTO Accommodations (
                Name, Location, Capacity, Availability,
                BudgetRange, PhotoURLs, Description,
                Amenities, ContactInfo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await executeQuery(query, [
            name,
            location,
            capacity,
            availability,
            budgetRange,
            photoURLs,
            description,
            amenities,
            contactInfo
        ]);

        console.log('Database insertion successful:', result);

        return res.render('success', {
            title: 'Accommodation Added',
            message: 'Accommodation added successfully!',
            backUrl: '/accommodations',
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error adding accommodation:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error adding accommodation',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.session.user || null
        });
    }
});

module.exports = router;
```

## .\src\routes\auth.js

```js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, hasPrivilege, isAdmin } = require('../middleware/auth');

// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

// Get current user
router.get('/current-user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            id: req.user.UserID,
            name: req.user.Name,
            email: req.user.Email,
            role: req.user.Role,
            username: req.user.username
        });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

// Check if user is admin
router.get('/is-admin', (req, res) => {
    if (req.isAuthenticated() && req.user.Role === 'admin') {
        res.json({ isAdmin: true });
    } else {
        res.json({ isAdmin: false });
    }
});

// Get user details by email
router.get('/users/:email', isAuthenticated, hasPrivilege('users', 'read'), async (req, res) => {
    try {
        const query = `
            SELECT u.UserID, u.Name, u.Email, u.Contact, u.username, r.RoleName as Role
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.Email = ?
        `;
        const users = await executeQuery(query, [req.params.email]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users (admin only)
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT u.UserID, u.Name, u.Email, u.Contact, u.username, r.RoleName as Role
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            ORDER BY u.UserID DESC
        `;
        const users = await executeQuery(query);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 
```

## .\src\routes\categories.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, hasPrivilege } = require('../middleware/auth');

// GET /categories - Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await executeQuery(`
            SELECT c.*, 
                   p.CategoryName as ParentCategoryName,
                   COUNT(e.EventID) as EventCount
            FROM EventCategories c
            LEFT JOIN EventCategories p ON c.ParentCategoryID = p.CategoryID
            LEFT JOIN Events e ON c.CategoryID = e.CategoryID
            GROUP BY c.CategoryID
            ORDER BY c.CategoryName ASC
        `);

        res.render('categories', {
            title: 'Event Categories',
            categories: categories,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading categories',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /categories/add - Show add category form
router.get('/add', isAuthenticated, hasPrivilege('categories', 'create'), async (req, res) => {
    try {
        const categories = await executeQuery('SELECT CategoryID, CategoryName FROM EventCategories');
        res.render('category-form', {
            title: 'Add Category',
            categories: categories,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error loading category form:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading form',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// POST /categories/add - Create new category
router.post('/add', isAuthenticated, hasPrivilege('categories', 'create'), async (req, res) => {
    try {
        const { categoryName, description, parentCategoryId } = req.body;

        // Check if category name already exists
        const existingCategory = await executeQuery(
            'SELECT CategoryID FROM EventCategories WHERE CategoryName = ?',
            [categoryName]
        );

        if (existingCategory.length > 0) {
            return res.status(400).json({
                error: 'Category name already exists'
            });
        }

        const result = await executeQuery(`
            INSERT INTO EventCategories (CategoryName, Description, ParentCategoryID)
            VALUES (?, ?, ?)
        `, [categoryName, description, parentCategoryId || null]);

        res.status(201).json({
            message: 'Category created successfully',
            categoryId: result.insertId
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /categories/edit/:id - Show edit category form
router.get('/edit/:id', isAuthenticated, hasPrivilege('categories', 'update'), async (req, res) => {
    try {
        const [category] = await executeQuery(`
            SELECT c.*, p.CategoryName as ParentCategoryName
            FROM EventCategories c
            LEFT JOIN EventCategories p ON c.ParentCategoryID = p.CategoryID
            WHERE c.CategoryID = ?
        `, [req.params.id]);

        if (!category) {
            return res.status(404).render('error', {
                title: 'Error',
                message: 'Category not found',
                error: {}
            });
        }

        const categories = await executeQuery(`
            SELECT CategoryID, CategoryName 
            FROM EventCategories 
            WHERE CategoryID != ?
        `, [req.params.id]);

        res.render('category-form', {
            title: 'Edit Category',
            category: category,
            categories: categories,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error loading category form:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading form',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// PUT /categories/:id - Update category
router.put('/:id', isAuthenticated, hasPrivilege('categories', 'update'), async (req, res) => {
    try {
        const { categoryName, description, parentCategoryId } = req.body;

        // Check if category name already exists (excluding current category)
        const existingCategory = await executeQuery(
            'SELECT CategoryID FROM EventCategories WHERE CategoryName = ? AND CategoryID != ?',
            [categoryName, req.params.id]
        );

        if (existingCategory.length > 0) {
            return res.status(400).json({
                error: 'Category name already exists'
            });
        }

        // Prevent circular references
        if (parentCategoryId === req.params.id) {
            return res.status(400).json({
                error: 'Category cannot be its own parent'
            });
        }

        const result = await executeQuery(`
            UPDATE EventCategories
            SET CategoryName = ?, Description = ?, ParentCategoryID = ?
            WHERE CategoryID = ?
        `, [categoryName, description, parentCategoryId || null, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /categories/:id - Delete category
router.delete('/:id', isAuthenticated, hasPrivilege('categories', 'delete'), async (req, res) => {
    try {
        // Check if category has events
        const events = await executeQuery(
            'SELECT COUNT(*) as count FROM Events WHERE CategoryID = ?',
            [req.params.id]
        );

        if (events[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete category with associated events'
            });
        }

        // Check if category has subcategories
        const subcategories = await executeQuery(
            'SELECT COUNT(*) as count FROM EventCategories WHERE ParentCategoryID = ?',
            [req.params.id]
        );

        if (subcategories[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete category with subcategories'
            });
        }

        const result = await executeQuery(
            'DELETE FROM EventCategories WHERE CategoryID = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/categories - Get all categories for API
router.get('/api/categories', async (req, res) => {
    try {
        const categories = await executeQuery(`
            SELECT c.*, 
                   p.CategoryName as ParentCategoryName,
                   COUNT(e.EventID) as EventCount
            FROM EventCategories c
            LEFT JOIN EventCategories p ON c.ParentCategoryID = p.CategoryID
            LEFT JOIN Events e ON c.CategoryID = e.CategoryID
            GROUP BY c.CategoryID
            ORDER BY c.CategoryName ASC
        `);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 
```

## .\src\routes\competitions.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /competitions - render competitions page
router.get('/', async (req, res) => {
    try {
        // Fetch event categories
        const categoriesQuery = 'SELECT * FROM EventCategories';
        const categories = await executeQuery(categoriesQuery);

        // Fetch competitions with category information
        const competitionsQuery = `
            SELECT e.*, ec.CategoryName, ec.Description as CategoryDescription
            FROM Events e
            JOIN EventCategories ec ON e.CategoryID = ec.CategoryID
            WHERE e.Status = 'Published'
            ORDER BY e.Date DESC
        `;
        const competitions = await executeQuery(competitionsQuery);

        res.render('competitions', {
            title: 'Competitions',
            categories: categories,
            competitions: competitions,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching competitions:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading competitions',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.user
        });
    }
});

// GET /api/events/competitions - get all competitions
router.get('/api/competitions', async (req, res) => {
    try {
        const { category } = req.query;
        let query = `
            SELECT e.*, ec.CategoryName, ec.Description as CategoryDescription
            FROM Events e
            JOIN EventCategories ec ON e.CategoryID = ec.CategoryID
            WHERE e.Status = 'Published'
        `;

        const params = [];
        if (category) {
            query += ' AND ec.CategoryName = ?';
            params.push(category);
        }

        query += ' ORDER BY e.Date DESC';
        const competitions = await executeQuery(query, params);
        res.json(competitions);
    } catch (error) {
        console.error('Error fetching competitions:', error);
        res.status(500).json({ 
            error: 'Failed to fetch competitions',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/events/categories - get all competition categories
router.get('/api/categories', async (req, res) => {
    try {
        const categories = await executeQuery('SELECT * FROM EventCategories');
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ 
            error: 'Failed to fetch categories',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /competitions/api/register - Register for a competition
router.post('/api/register', async (req, res) => {
    try {
        const { eventId, userId, registrationType, teamId } = req.body;

        // Validate required fields
        if (!eventId || !userId || !registrationType) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        // Check if event exists and is open for registration
        const eventQuery = `
            SELECT EventID, EventType, Max_Participants, RegistrationDeadline
            FROM Events
            WHERE EventID = ? AND Status = 'Published'
        `;
        const events = await executeQuery(eventQuery, [eventId]);
        
        if (events.length === 0) {
            return res.status(404).json({
                error: 'Event not found or registration is closed'
            });
        }

        const event = events[0];

        // Check registration deadline
        if (new Date(event.RegistrationDeadline) < new Date()) {
            return res.status(400).json({
                error: 'Registration deadline has passed'
            });
        }

        // Check if user is already registered
        const existingRegistrationQuery = `
            SELECT RegistrationID
            FROM EventRegistrations
            WHERE EventID = ? AND UserID = ?
        `;
        const existingRegistrations = await executeQuery(existingRegistrationQuery, [eventId, userId]);
        
        if (existingRegistrations.length > 0) {
            return res.status(400).json({
                error: 'You are already registered for this event'
            });
        }

        // Handle team registration
        if (registrationType === 'Team') {
            if (!teamId) {
                return res.status(400).json({
                    error: 'Team ID is required for team registration'
                });
            }

            // Check if team exists and user is a member
            const teamQuery = `
                SELECT t.TeamID, t.LeaderID, tm.UserID
                FROM Teams t
                LEFT JOIN TeamMembers tm ON t.TeamID = tm.TeamID
                WHERE t.TeamID = ? AND (t.LeaderID = ? OR tm.UserID = ?)
            `;
            const teams = await executeQuery(teamQuery, [teamId, userId, userId]);
            
            if (teams.length === 0) {
                return res.status(403).json({
                    error: 'You are not a member of this team'
                });
            }
        }

        // Insert registration
        const insertQuery = `
            INSERT INTO EventRegistrations (
                EventID, UserID, TeamID, RegistrationType
            ) VALUES (?, ?, ?, ?)
        `;
        await executeQuery(insertQuery, [
            eventId,
            userId,
            registrationType === 'Team' ? teamId : null,
            registrationType
        ]);

        res.status(201).json({
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('Error in competition registration:', error);
        res.status(500).json({
            error: 'Registration failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 
```

## .\src\routes\contact.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /contact - Render contact page
router.get('/', (req, res) => {
    res.render('contact', {
        title: 'Contact & Support',
        user: req.session.user || null
    });
});

// POST /contact/api/inquiries - Handle contact form submissions
router.post('/api/inquiries', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'Name, email, subject, and message are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                details: 'Please provide a valid email address'
            });
        }

        // Insert inquiry into database
        const query = `
            INSERT INTO ContactInquiries (Name, Email, Subject, Message, Status)
            VALUES (?, ?, ?, ?, 'Pending')
        `;
        
        await executeQuery(query, [name, email, subject, message]);

        res.status(201).json({
            message: 'Your message has been sent successfully. We will get back to you soon.'
        });
    } catch (error) {
        console.error('Error in contact form submission:', error);
        res.status(500).json({
            error: 'Failed to submit contact form',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 
```

## .\src\routes\events.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, hasPrivilege, requireRole } = require('../middleware/auth');
const { eventValidation } = require('../middleware/validation');

// Helper function to get event icon based on category
function getEventIcon(category) {
    const icons = {
        'Competition': 'fas fa-trophy',
        'Workshop': 'fas fa-chalkboard-teacher',
        'Seminar': 'fas fa-microphone',
        'Cultural': 'fas fa-theater-masks',
        'Sports': 'fas fa-running',
        'Technical': 'fas fa-laptop-code',
        'default': 'fas fa-calendar-alt'
    };
    return icons[category] || icons.default;
}

// GET /events - Get all events
router.get('/', async (req, res) => {
    try {
        const events = await executeQuery(`
            SELECT 
                e.EventID,
                e.Name,
                DATE_FORMAT(e.Date, '%Y-%m-%d') as Date,
                e.Time,
                e.EventDescription,
                e.EventType,
                e.Status,
                e.Reg_Fee,
                e.Max_Participants,
                e.Rules,
                e.RegistrationDeadline,
                v.Name as VenueName,
                v.Location as VenueLocation,
                c.CategoryName,
                u.Name as OrganizerName,
                COUNT(DISTINCT r.UserID) as RegisteredParticipants
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            LEFT JOIN EventCategories c ON e.CategoryID = c.CategoryID
            LEFT JOIN Users u ON e.OrganizerID = u.UserID
            LEFT JOIN Registrations r ON e.EventID = r.EventID
            GROUP BY e.EventID
            ORDER BY e.Date ASC, e.Time ASC
        `);

        res.render('events', {
            title: 'NASCON Events',
            events,
            getEventIcon,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).render('error', {
            message: 'Error fetching events',
            error
        });
    }
});

// GET /events/add - Show event creation form
router.get('/add', isAuthenticated, hasPrivilege('Events.create'), async (req, res) => {
    try {
        const [categories, venues] = await Promise.all([
            executeQuery('SELECT * FROM EventCategories ORDER BY CategoryName'),
            executeQuery('SELECT * FROM Venues ORDER BY Name')
        ]);

        res.render('event-form', {
            title: 'Create Event',
            event: null,
            categories,
            venues,
            user: req.user
        });
    } catch (error) {
        console.error('Error loading event form:', error);
        res.status(500).render('error', {
            message: 'Error loading event form',
            error
        });
    }
});

// POST /events/add - Create new event
router.post('/add', isAuthenticated, hasPrivilege('Events.create'), eventValidation, async (req, res) => {
    try {
        const {
            name, categoryId, eventType, status, eventDescription,
            date, time, registrationDeadline, venueId, maxParticipants,
            regFee
        } = req.body;

        const result = await executeQuery(`
            INSERT INTO Events (
                Name, CategoryID, EventType, Status, EventDescription,
                Date, Time, RegistrationDeadline, VenueID, Max_Participants,
                Reg_Fee, OrganizerID
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, categoryId, eventType, status, eventDescription,
            date, time, registrationDeadline, venueId, maxParticipants,
            regFee, req.user.UserID
        ]);

        res.json({
            success: true,
            eventId: result.insertId,
            message: 'Event created successfully'
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            error: 'Error creating event'
        });
    }
});

// GET /events/:id - Get event details
router.get('/:id', async (req, res) => {
    try {
        // Fetch event with joins for category and organizer names
        const [event] = await executeQuery(`
            SELECT 
                e.*,
                v.Name as VenueName,
                v.Location as VenueLocation,
                v.Capacity as VenueCapacity,
                c.CategoryName,
                u.Name as OrganizerName
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            LEFT JOIN EventCategories c ON e.CategoryID = c.CategoryID
            LEFT JOIN Users u ON e.OrganizerID = u.UserID
            WHERE e.EventID = ?
        `, [req.params.id]);

        if (!event) {
            return res.status(404).render('error', {
                message: 'Event not found',
                error: { status: 404 }
            });
        }

        // Get assigned judges
        const judges = await executeQuery(`
            SELECT 
                j.JudgeID,
                j.Specialization,
                u.Name,
                ej.AssignedAt
            FROM EventJudges ej
            JOIN Judges j ON ej.JudgeID = j.JudgeID
            JOIN Users u ON j.UserID = u.UserID
            WHERE ej.EventID = ? AND ej.Status = 'assigned'
            ORDER BY ej.AssignedAt DESC
        `, [req.params.id]);

        // Get rankings
        const rankings = await executeQuery(`
            SELECT 
                u.UserID as ParticipantUserID,
                u.Name as ParticipantName,
                COUNT(DISTINCT s.JudgeID) as JudgeCount,
                SUM(s.Value) as TotalScore,
                AVG(s.Value) as AverageScore
            FROM Users u
            JOIN Registrations r ON u.UserID = r.UserID
            LEFT JOIN Scores s ON r.RegistrationID = s.RegistrationID
            WHERE r.EventID = ?
            GROUP BY u.UserID
            ORDER BY TotalScore DESC, AverageScore DESC
        `, [req.params.id]);

        // Get participants
        const participants = await executeQuery(`
            SELECT 
                u.Name, u.Email, r.RegistrationDate, t.TeamName, r.PaymentStatus
            FROM Registrations r
            JOIN Users u ON r.UserID = u.UserID
            LEFT JOIN Teams t ON r.TeamID = t.TeamID
            WHERE r.EventID = ?
            ORDER BY r.RegistrationDate ASC
        `, [req.params.id]);

        res.render('event-details', {
            title: event.Name,
            event,
            judges,
            rankings,
            participants,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching event details:', error);
        res.status(500).render('error', {
            message: 'Error loading event details',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /events/edit/:id - Show event edit form
router.get('/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const [event] = await executeQuery('SELECT * FROM Events WHERE EventID = ?', [req.params.id]);

        if (!event) {
            return res.status(404).render('error', {
                message: 'Event not found'
            });
        }

        // Debug log
        console.log('DEBUG: UserID:', req.user.UserID, 'Privileges:', req.user.privileges, 'Event OrganizerID:', event.OrganizerID);

        // Check if user has permission to edit this event
        if (!req.user.privileges?.Events?.update && req.user.UserID !== event.OrganizerID) {
            return res.status(403).render('error', {
                message: 'You do not have permission to edit this event'
            });
        }

        const [categories, venues] = await Promise.all([
            executeQuery('SELECT * FROM EventCategories ORDER BY CategoryName'),
            executeQuery('SELECT * FROM Venues ORDER BY Name')
        ]);

        res.render('event-form', {
            title: 'Edit Event',
            event,
            categories,
            venues,
            user: req.user
        });
    } catch (error) {
        console.error('Error loading event form:', error);
        res.status(500).render('error', {
            message: 'Error loading event form',
            error
        });
    }
});

// POST /events/edit/:id - Update event
router.post('/edit/:id', isAuthenticated, eventValidation, async (req, res) => {
    try {
        const [event] = await executeQuery('SELECT * FROM Events WHERE EventID = ?', [req.params.id]);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Debug log
        console.log('DEBUG: UserID:', req.user.UserID, 'Privileges:', req.user.privileges, 'Event OrganizerID:', event.OrganizerID);

        // Check if user has permission to edit this event
        if (!req.user.privileges?.Events?.update && req.user.UserID !== event.OrganizerID) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this event'
            });
        }

        const {
            name, categoryId, eventType, status, eventDescription,
            date, time, registrationDeadline, venueId, maxParticipants,
            regFee, rules
        } = req.body;

        await executeQuery(`
            UPDATE Events SET
                Name = ?,
                CategoryID = ?,
                EventType = ?,
                Status = ?,
                EventDescription = ?,
                Date = ?,
                Time = ?,
                RegistrationDeadline = ?,
                VenueID = ?,
                Max_Participants = ?,
                Reg_Fee = ?,
                Rules = ?
            WHERE EventID = ?
        `, [
            name, categoryId, eventType, status, eventDescription,
            date, time, registrationDeadline, venueId, maxParticipants,
            regFee, rules, req.params.id
        ]);

        res.json({
            success: true,
            message: 'Event updated successfully'
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating event'
        });
    }
});

// POST /events/delete/:id - Delete event
router.post('/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const [event] = await executeQuery('SELECT * FROM Events WHERE EventID = ?', [req.params.id]);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user has permission to delete this event
        if (!req.user.privileges?.Events?.delete && req.user.UserID !== event.OrganizerID) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this event'
            });
        }

        // Delete related records first
        await executeQuery('DELETE FROM EventJudges WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Registrations WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Teams WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Scores WHERE EventID = ?', [req.params.id]);

        // Finally delete the event
        await executeQuery('DELETE FROM Events WHERE EventID = ?', [req.params.id]);

        // If it's an AJAX request, send JSON response
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.json({
                success: true,
                message: 'Event deleted successfully'
            });
        }

        // Otherwise redirect to events page
        res.redirect('/events');
    } catch (error) {
        console.error('Error deleting event:', error);
        
        // If it's an AJAX request, send JSON response
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                error: 'Error deleting event'
            });
        }

        // Otherwise render error page
        res.status(500).render('error', {
            message: 'Error deleting event',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// DELETE /events/:id - Delete event (AJAX)
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const [event] = await executeQuery('SELECT * FROM Events WHERE EventID = ?', [req.params.id]);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user has permission to delete this event
        if (!req.user.privileges?.Events?.delete && req.user.UserID !== event.OrganizerID) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this event'
            });
        }

        // Delete related records first
        await executeQuery('DELETE FROM EventJudges WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Registrations WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Teams WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Scores WHERE EventID = ?', [req.params.id]);

        // Finally delete the event
        await executeQuery('DELETE FROM Events WHERE EventID = ?', [req.params.id]);

        return res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({
            success: false,
            error: 'Error deleting event'
        });
    }
});

module.exports = router; 
```

## .\src\routes\faq.js

```js
const express = require('express');
const router = express.Router();

// Registration Process FAQ
router.get('/registration', (req, res) => {
    res.render('faq/registration', {
        title: 'Registration Process FAQ',
        user: req.session.user || null
    });
});

// Registration Fees FAQ
router.get('/fees', (req, res) => {
    res.render('faq/fees', {
        title: 'Registration Fees FAQ',
        user: req.session.user || null
    });
});

// Refund Policy FAQ
router.get('/refund', (req, res) => {
    res.render('faq/refund', {
        title: 'Refund Policy FAQ',
        user: req.session.user || null
    });
});

module.exports = router; 
```

## .\src\routes\index.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET / - Home page
router.get('/', async (req, res) => {
    try {
        // Fetch upcoming events with venue details
        const query = `
            SELECT 
                e.EventID,
                e.Name as EventName,
                e.Date,
                e.Time,
                e.EventDescription,
                v.Name as VenueName,
                v.Location
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            WHERE e.Date >= CURDATE()
            ORDER BY e.Date, e.Time
            LIMIT 9
        `;

        const events = await executeQuery(query);

        // Group events by date
        const schedule = events.reduce((acc, event) => {
            const date = new Date(event.Date).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(event);
            return acc;
        }, {});

        res.render('index', {
            title: 'NASCON - National Software Competition',
            schedule: schedule,
            user: req.user || null
        });
    } catch (error) {
        console.error('Error fetching home page data:', error);
        res.render('index', {
            title: 'NASCON - National Software Competition',
            schedule: {},
            user: req.user || null
        });
    }
});

module.exports = router; 
```

## .\src\routes\judges.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, hasPrivilege } = require('../middleware/auth');

// GET /judges - Render judges management page
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const judges = await executeQuery(`
            SELECT 
                j.JudgeID,
                j.UserID,
                j.Specialization,
                j.Status,
                u.Name,
                u.Email,
                COUNT(DISTINCT ej.EventID) as AssignedEvents
            FROM Judges j
            JOIN Users u ON j.UserID = u.UserID
            LEFT JOIN EventJudges ej ON j.JudgeID = ej.JudgeID
            GROUP BY j.JudgeID
            ORDER BY j.Status ASC, u.Name ASC
        `);

        res.render('judges', {
            title: 'Judges Management',
            judges: judges,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching judges:', error);
        res.status(500).render('error', {
            message: 'Error loading judges',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /judges/add - Show judge creation form
router.get('/add', isAuthenticated, hasPrivilege('judges.create'), async (req, res) => {
    try {
        // Get users who are not already judges
        const users = await executeQuery(`
            SELECT u.UserID, u.Name, u.Email
            FROM Users u
            LEFT JOIN Judges j ON u.UserID = j.UserID
            WHERE j.JudgeID IS NULL
            ORDER BY u.Name
        `);

        res.render('judge-form', {
            title: 'Add Judge',
            users: users,
            judge: null,
            user: req.user
        });
    } catch (error) {
        console.error('Error loading judge form:', error);
        res.status(500).render('error', {
            message: 'Error loading judge form',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// POST /judges - Create new judge
router.post('/', isAuthenticated, hasPrivilege('judges.create'), async (req, res) => {
    try {
        const { userId, specialization } = req.body;

        // Check if user is already a judge
        const existingJudge = await executeQuery(
            'SELECT JudgeID FROM Judges WHERE UserID = ?',
            [userId]
        );

        if (existingJudge.length > 0) {
            return res.status(400).json({
                error: 'User is already a judge'
            });
        }

        // Create new judge
        const result = await executeQuery(`
            INSERT INTO Judges (UserID, Specialization, Status)
            VALUES (?, ?, 'active')
        `, [userId, specialization]);

        res.status(201).json({
            message: 'Judge created successfully',
            judgeId: result.insertId
        });
    } catch (error) {
        console.error('Error creating judge:', error);
        res.status(500).json({
            error: 'Failed to create judge'
        });
    }
});

// GET /judges/:id - Get judge details
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const [judge] = await executeQuery(`
            SELECT 
                j.*,
                u.Name,
                u.Email,
                u.Contact
            FROM Judges j
            JOIN Users u ON j.UserID = u.UserID
            WHERE j.JudgeID = ?
        `, [req.params.id]);

        if (!judge) {
            return res.status(404).json({
                error: 'Judge not found'
            });
        }

        // Get events assigned to judge
        const events = await executeQuery(`
            SELECT 
                e.EventID,
                e.Name as EventName,
                e.Date,
                e.Time,
                ej.AssignedAt,
                ej.Status as AssignmentStatus
            FROM EventJudges ej
            JOIN Events e ON ej.EventID = e.EventID
            WHERE ej.JudgeID = ?
            ORDER BY e.Date DESC
        `, [req.params.id]);

        res.json({
            ...judge,
            events
        });
    } catch (error) {
        console.error('Error fetching judge:', error);
        res.status(500).json({
            error: 'Failed to fetch judge details'
        });
    }
});

// PUT /judges/:id - Update judge
router.put('/:id', isAuthenticated, hasPrivilege('judges.update'), async (req, res) => {
    try {
        const { specialization, status } = req.body;

        await executeQuery(`
            UPDATE Judges
            SET Specialization = ?,
                Status = ?,
                UpdatedAt = CURRENT_TIMESTAMP
            WHERE JudgeID = ?
        `, [specialization, status, req.params.id]);

        res.json({
            message: 'Judge updated successfully'
        });
    } catch (error) {
        console.error('Error updating judge:', error);
        res.status(500).json({
            error: 'Failed to update judge'
        });
    }
});

// DELETE /judges/:id - Delete judge
router.delete('/:id', isAuthenticated, hasPrivilege('judges.delete'), async (req, res) => {
    try {
        // Check if judge has any event assignments
        const [{ count }] = await executeQuery(
            'SELECT COUNT(*) as count FROM EventJudges WHERE JudgeID = ?',
            [req.params.id]
        );

        if (count > 0) {
            return res.status(400).json({
                error: 'Cannot delete judge with event assignments'
            });
        }

        await executeQuery('DELETE FROM Judges WHERE JudgeID = ?', [req.params.id]);

        res.json({
            message: 'Judge deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting judge:', error);
        res.status(500).json({
            error: 'Failed to delete judge'
        });
    }
});

// POST /judges/:id/events/:eventId - Assign judge to event
router.post('/:id/events/:eventId', isAuthenticated, hasPrivilege('judges.assign'), async (req, res) => {
    try {
        const { id: judgeId, eventId } = req.params;

        // Check if judge is already assigned to this event
        const existingAssignment = await executeQuery(
            'SELECT * FROM EventJudges WHERE JudgeID = ? AND EventID = ?',
            [judgeId, eventId]
        );

        if (existingAssignment.length > 0) {
            return res.status(400).json({
                error: 'Judge is already assigned to this event'
            });
        }

        // Create assignment
        await executeQuery(`
            INSERT INTO EventJudges (JudgeID, EventID, Status, AssignedAt)
            VALUES (?, ?, 'assigned', CURRENT_TIMESTAMP)
        `, [judgeId, eventId]);

        res.status(201).json({
            message: 'Judge assigned successfully'
        });
    } catch (error) {
        console.error('Error assigning judge:', error);
        res.status(500).json({
            error: 'Failed to assign judge'
        });
    }
});

// DELETE /judges/:id/events/:eventId - Remove judge from event
router.delete('/:id/events/:eventId', isAuthenticated, hasPrivilege('judges.assign'), async (req, res) => {
    try {
        const { id: judgeId, eventId } = req.params;

        await executeQuery(
            'DELETE FROM EventJudges WHERE JudgeID = ? AND EventID = ?',
            [judgeId, eventId]
        );

        res.json({
            message: 'Judge removed from event successfully'
        });
    } catch (error) {
        console.error('Error removing judge from event:', error);
        res.status(500).json({
            error: 'Failed to remove judge from event'
        });
    }
});

// GET /judges/available-for-event/:eventId - Get judges not assigned to this event
router.get('/available-for-event/:eventId', isAuthenticated, hasPrivilege('judges.assign'), async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const judges = await executeQuery(`
            SELECT j.JudgeID, u.Name, j.Specialization
            FROM Judges j
            JOIN Users u ON j.UserID = u.UserID
            WHERE j.JudgeID NOT IN (
                SELECT JudgeID FROM EventJudges WHERE EventID = ? AND Status = 'assigned'
            )
            AND j.Status = 'active'
            ORDER BY u.Name ASC
        `, [eventId]);
        res.json(judges);
    } catch (error) {
        console.error('Error fetching available judges:', error);
        res.status(500).json({ error: 'Failed to fetch available judges' });
    }
});

// POST /judges/assign-to-event - Assign judge to event (for HTML forms)
router.post('/assign-to-event', isAuthenticated, hasPrivilege('judges.assign'), async (req, res) => {
    try {
        const { judgeId, eventId } = req.body;
        // Check if judge is already assigned to this event
        const existingAssignment = await executeQuery(
            'SELECT * FROM EventJudges WHERE JudgeID = ? AND EventID = ?',
            [judgeId, eventId]
        );
        if (existingAssignment.length > 0) {
            return res.status(400).render('error', { message: 'Judge is already assigned to this event' });
        }
        // Create assignment
        await executeQuery(
            'INSERT INTO EventJudges (JudgeID, EventID, Status, AssignedAt) VALUES (?, ?, "assigned", CURRENT_TIMESTAMP)',
            [judgeId, eventId]
        );
        res.redirect(`/events/${eventId}`);
    } catch (error) {
        console.error('Error assigning judge:', error);
        res.status(500).render('error', { message: 'Failed to assign judge', error });
    }
});

module.exports = router; 
```

## .\src\routes\login.js

```js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { executeQuery } = require('../config/database');
const { setNotification } = require('../middleware/notification');
const passport = require('passport');

// GET /login - Render login page
router.get('/', (req, res) => {
    // Show success message if user just registered
    if (req.query.registered === 'true') {
        setNotification(req, 'Registration successful! Please log in.', 'success');
    }
    
    res.render('login', {
        title: 'Login',
        user: req.user,
        url: req.originalUrl
    });
});

// POST /login - Handle login
router.post('/', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Login failed', details: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Login failed', details: info && info.message ? info.message : 'Invalid email or password' });
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.status(500).json({ error: 'Login failed', details: err.message });
            }
            // Optionally set a notification here
            return res.json({
                message: 'Login successful',
                user: {
                    id: user.UserID,
                    name: user.Name,
                    email: user.Email,
                    role: user.Role,
                    username: user.username
                },
                redirect: '/'
            });
        });
    })(req, res, next);
});

module.exports = router; 
```

## .\src\routes\payments.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// GET /payments - render payments page
router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        res.render('payments', {
            title: 'Payments & Finance',
            user: req.user
        });
    } catch (error) {
        console.error('Error loading payments page:', error);
        next(error);
    }
});
router.post('/', isAuthenticated, async (req, res) => {
    const { amount, type } = req.body;
    await executeQuery(
      `INSERT INTO Payments (UserID, Amount, Type, Status) VALUES (?, ?, ?, 'paid')`,
      [req.session.user.id, amount, type]
    );
    res.json({ message: 'Payment recorded' });
  });
  
// POST /api/payments/registration - Process registration payment
router.post('/api/payments/registration', isAuthenticated, async (req, res, next) => {
    try {
        const { participantId, eventId, amount, paymentMethod } = req.body;

        // Validate request
        if (!participantId || !eventId || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create payment record
        const createPaymentQuery = `
            INSERT INTO Payments (
                ParticipantUserID,
                Amount,
                PaymentMethod,
                Status,
                Description,
                PaymentDate
            ) VALUES (?, ?, ?, 'completed', 'Event Registration Payment', NOW())
        `;
        const result = await executeQuery(createPaymentQuery, [
            participantId,
            amount,
            paymentMethod
        ]);

        // Update registration payment status
        await executeQuery(`
            UPDATE Registrations 
            SET PaymentStatus = 'paid', 
                PaymentID = ? 
            WHERE UserID = ? AND EventID = ?
        `, [result.insertId, participantId, eventId]);

        res.status(201).json({
            message: 'Payment processed successfully',
            paymentId: result.insertId
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        next(error);
    }
});

// POST /api/payments/sponsorship - Record sponsorship payment
router.post('/api/payments/sponsorship', async (req, res) => {
    try {
        const { sponsorId, amount, paymentMethod, description } = req.body;

        // Validate request
        if (!sponsorId || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create sponsorship payment record
        const createPaymentQuery = `
            INSERT INTO Payments (
                SponsorID,
                Amount,
                PaymentMethod,
                Status,
                Description,
                PaymentDate
            ) VALUES (?, ?, ?, 'completed', ?, NOW())
        `;
        const result = await executeQuery(createPaymentQuery, [
            sponsorId,
            amount,
            paymentMethod,
            description || 'Sponsorship Payment'
        ]);

        res.status(201).json({
            message: 'Sponsorship payment recorded successfully',
            paymentId: result.insertId
        });
    } catch (error) {
        console.error('Error recording sponsorship payment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/payments/reports/registration - Generate registration revenue report
router.get('/api/payments/reports/registration', async (req, res) => {
    try {
        const report = await executeQuery(`
            SELECT 
                e.Name as EventName,
                COUNT(p.PaymentID) as TotalPayments,
                SUM(p.Amount) as TotalRevenue,
                COUNT(DISTINCT p.ParticipantUserID) as UniqueParticipants
            FROM Events e
            LEFT JOIN Registrations r ON e.EventID = r.EventID
            LEFT JOIN Payments p ON r.PaymentID = p.PaymentID
            WHERE p.ParticipantUserID IS NOT NULL
            GROUP BY e.EventID
            ORDER BY TotalRevenue DESC
        `);
        res.json(report);
    } catch (error) {
        console.error('Error generating registration report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/payments/reports/sponsorship - Generate sponsorship revenue report
router.get('/api/payments/reports/sponsorship', async (req, res) => {
    try {
        const report = await executeQuery(`
            SELECT 
                s.Name as SponsorName,
                s.SponsorshipLevel as SponsorshipTier,
                COUNT(p.PaymentID) as TotalPayments,
                SUM(p.Amount) as TotalAmount,
                MAX(p.PaymentDate) as LastPaymentDate
            FROM Sponsors s
            LEFT JOIN Payments p ON s.SponsorID = p.SponsorID
            WHERE p.SponsorID IS NOT NULL
            GROUP BY s.SponsorID
            ORDER BY TotalAmount DESC
        `);
        res.json(report);
    } catch (error) {
        console.error('Error generating sponsorship report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/payments/reports/accommodation - Generate accommodation revenue report
router.get('/api/payments/reports/accommodation', async (req, res) => {
    try {
        const report = await executeQuery(`
            SELECT 
                a.Name as AccommodationName,
                COUNT(ar.RequestID) as TotalRequests,
                SUM(ar.Budget) as TotalRevenue,
                AVG(ar.Budget) as AverageRevenue
            FROM Accommodations a
            LEFT JOIN AccommodationRequests ar ON a.AccommodationID = ar.AccommodationID
            WHERE ar.Status = 'Approved'
            GROUP BY a.AccommodationID
            ORDER BY TotalRevenue DESC
        `);
        res.json(report);
    } catch (error) {
        console.error('Error generating accommodation report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/events - Get all events for payment form
router.get('/events', async (req, res) => {
    try {
        const events = await executeQuery(`
            SELECT 
                e.EventID,
                e.Name,
                e.Date,
                e.Reg_Fee as Fee
            FROM Events e
            WHERE e.Status = 'Published'
            AND e.Date >= CURDATE()
            ORDER BY e.Date ASC
        `);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/sponsors - Get all sponsors for payment form
router.get('/sponsors', async (req, res) => {
    try {
        const sponsors = await executeQuery(`
            SELECT 
                s.SponsorID,
                s.Name,
                s.SponsorshipLevel
            FROM Sponsors s
            WHERE s.Status = 'active'
            ORDER BY s.SponsorshipLevel DESC, s.Name ASC
        `);
        res.json(sponsors);
    } catch (error) {
        console.error('Error fetching sponsors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
```

## .\src\routes\registration.js

```js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { executeQuery } = require('../config/database');
const passwordValidator = require('../utils/passwordValidator');
const { registerValidation } = require('../middleware/validation');
const { isAuthenticated } = require('../middleware/auth');

// Mapping allowed roles
const roleMapping = {
  '1': 1, // participant
  '2': 2, // event_organizer
  '3': 3, // sponsor
  '4': 4  // judge
};

// GET /register - Render registration page
router.get('/', (req, res) => {
  res.render('registration', {
    title: 'NASCON Registration',
    user: req.session.user || null,
    error: null
  });
});

// POST /register/api/register - Register a new user
router.post('/api/register', registerValidation, async (req, res) => {
  try {
    const { name, email, password, contact, username, roleId } = req.body;
    console.log('Registration attempt:', { name, email, username, roleId });

    // Validate roleId
    const resolvedRoleId = roleMapping[roleId];
    if (!resolvedRoleId) {
      console.warn('Role validation failed:', { roleId, resolvedRoleId });
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    // Check for existing email
    console.log('Checking for existing email:', email);
    const existingEmail = await executeQuery(
      'SELECT UserID FROM Users WHERE Email = ?',
      [email]
    );
    if (existingEmail.length > 0) {
      console.warn('Email already exists:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check for existing username
    console.log('Checking for existing username:', username);
    const existingUser = await executeQuery(
      'SELECT UserID FROM Users WHERE username = ?',
      [username]
    );
    if (existingUser.length > 0) {
      console.warn('Username already exists:', username);
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Validate password complexity
    if (!passwordValidator(password)) {
      console.warn('Password validation failed');
      return res.status(400).json({ error: 'Password does not meet complexity requirements' });
    }

    // Hash password
    console.log('Hashing password...');
    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    console.log('Attempting to insert user into database...');
    const insertSql = `
      INSERT INTO Users (
        Name, Email, Password, Contact, username,
        RoleID, Status, LastLogin, CreatedAt, UpdatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', NULL, NOW(), NOW())
    `;
    const result = await executeQuery(insertSql, [
      name,
      email,
      hashed,
      contact || null,
      username,
      resolvedRoleId
    ]);
    console.log('User inserted successfully:', result);

    // Return success response
    return res.status(201).json({ 
      message: 'Registration successful',
      user: {
        name,
        email,
        username,
        roleId: resolvedRoleId
      }
    });
  } catch (err) {
    console.error('Error in registration:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sqlState: err.sqlState
    });
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /registration/api/registrations - API event registration
router.post('/api/registrations', async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    if (!userId || !eventId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await executeQuery(
      'SELECT UserID FROM Users WHERE UserID = ?',
      [userId]
    );
    if (user.length === 0) return res.status(404).json({ error: 'User not found' });

    const event = await executeQuery(
      'SELECT EventID FROM Events WHERE EventID = ?',
      [eventId]
    );
    if (event.length === 0) return res.status(404).json({ error: 'Event not found' });

    const exists = await executeQuery(
      'SELECT * FROM Registrations WHERE UserID = ? AND EventID = ?',
      [userId, eventId]
    );
    if (exists.length > 0) return res.status(400).json({ error: 'Already registered' });

    await executeQuery(
      'INSERT INTO Registrations (UserID, EventID, PaymentStatus) VALUES (?, ?, ?)',
      [userId, eventId, 'Pending']
    );
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Registration API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /registration - User-facing event registration
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.UserID;
    const { eventId, specialRequirements } = req.body;

    const event = await executeQuery(
      'SELECT * FROM Events WHERE EventID = ?',
      [eventId]
    );
    if (event.length === 0) {
      return res.status(404).render('error', { message: 'Event not found' });
    }

    const existingReg = await executeQuery(
      'SELECT RegistrationID FROM Registrations WHERE EventID = ? AND UserID = ?',
      [eventId, userId]
    );
    if (existingReg.length > 0) {
      return res.status(400).render('error', { message: 'Already registered' });
    }

    const insert = await executeQuery(
      `INSERT INTO Registrations (UserID, EventID, PaymentStatus, Status, RegistrationDate, SpecialRequirements)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [userId, eventId, 'pending', 'pending', specialRequirements || null]
    );
    res.redirect(`/registration/success?id=${insert.insertId}`);
  } catch (err) {
    console.error('Error creating registration:', err);
    res.status(500).render('error', { message: 'Registration failed' });
  }
});

// GET /registration/success - Confirmation
router.get('/success', isAuthenticated, async (req, res) => {
  try {
    const regId = req.query.id;
    const userId = req.session.user.UserID;

    const rows = await executeQuery(
      `SELECT r.*, e.Name AS EventName, e.Date AS EventDate, e.Time AS EventTime,
              e.Reg_Fee AS RegistrationFee, e.EventType,
              v.Name AS VenueName, t.TeamName
       FROM Registrations r
       JOIN Events e ON r.EventID = e.EventID
       LEFT JOIN Venues v ON e.VenueID = v.VenueID
       LEFT JOIN Teams t ON r.TeamID = t.TeamID
       WHERE r.RegistrationID = ? AND r.UserID = ?`,
      [regId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).render('error', { message: 'Registration not found' });
    }
    const registration = rows[0];

    let team = null;
    if (['Team', 'Both'].includes(registration.EventType)) {
      const tRows = await executeQuery(
        `SELECT t.*, COUNT(tm.UserID) AS MemberCount
         FROM Teams t
         LEFT JOIN TeamMembers tm ON t.TeamID = tm.TeamID
         WHERE t.EventID = ? AND t.LeaderID = ?
         GROUP BY t.TeamID`,
        [registration.EventID, userId]
      );
      if (tRows.length) {
        team = tRows[0];
        team.members = await executeQuery(
          `SELECT u.Name, u.Email, tm.Role, tm.Status
           FROM TeamMembers tm
           JOIN Users u ON tm.UserID = u.UserID
           WHERE tm.TeamID = ?
           ORDER BY tm.Role DESC, u.Name ASC`,
          [team.TeamID]
        );
      }
    }
    res.render('registration-success', { title: 'Registration Successful', registration, team, user: req.session.user });
  } catch (err) {
    console.error('Success page error:', err);
    res.status(500).render('error', { message: 'Failed to load details' });
  }
});

// PATCH /registration/:id - Update registration
router.patch('/:id', isAuthenticated, async (req, res) => {
  try {
    const regId = req.params.id;
    const userId = req.session.user.UserID;
    const { teamId } = req.body;

    const rows = await executeQuery(
      'SELECT * FROM Registrations WHERE RegistrationID = ? AND UserID = ?',
      [regId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    await executeQuery(
      'UPDATE Registrations SET TeamID = ? WHERE RegistrationID = ?',
      [teamId, regId]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;

```

## .\src\routes\schedule.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /schedule - Render schedule page
router.get('/', async (req, res) => {
    try {
        // Fetch all events with venue details
        const query = `
            SELECT 
                e.EventID,
                e.Name as EventName,
                e.Date,
                e.Time,
                e.EventDescription,
                e.Max_Participants,
                e.Reg_Fee,
                v.Name as VenueName,
                v.Location,
                u.Name as OrganizerName
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            LEFT JOIN Users u ON e.OrganizerID = u.UserID
            WHERE e.Date >= CURDATE()
            ORDER BY e.Date ASC, e.Time ASC
        `;

        const events = await executeQuery(query);

        // Group events by date
        const schedule = events.reduce((acc, event) => {
            const date = new Date(event.Date).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(event);
            return acc;
        }, {});

        res.render('schedule', {
            title: 'Event Schedule',
            schedule: schedule,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading schedule. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /schedule/api/events - Get all events with optional filters
router.get('/api/events', async (req, res) => {
    try {
        const { date, category, search } = req.query;
        let query = `
            SELECT 
                e.EventID,
                e.Name,
                e.Date,
                e.Time,
                e.EventDescription,
                e.Max_Participants,
                e.Reg_Fee,
                v.Name as VenueName,
                v.Location as VenueLocation,
                u.Name as OrganizerName
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            LEFT JOIN Users u ON e.OrganizerID = u.UserID
            WHERE 1=1
        `;
        
        const params = [];
        
        if (date) {
            query += ` AND DATE(e.Date) = ?`;
            params.push(date);
        }
        
        if (category) {
            query += ` AND e.Category = ?`;
            params.push(category);
        }
        
        if (search) {
            query += ` AND (e.Name LIKE ? OR e.EventDescription LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY e.Date ASC, e.Time ASC`;

        const events = await executeQuery(query, params);
        
        // Group events by date
        const eventsByDate = events.reduce((acc, event) => {
            const date = new Date(event.Date).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(event);
            return acc;
        }, {});

        // Get unique categories
        const categories = [...new Set(events.map(event => event.Category))];

        res.json({
            eventsByDate,
            categories
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Failed to fetch events',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 
```

## .\src\routes\scores.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, isJudge } = require('../middleware/auth');

// GET /scores/event/:eventId - Get all scores for an event
router.get('/event/:eventId', isAuthenticated, async (req, res) => {
    try {
        const scores = await executeQuery(`
            SELECT 
                s.ScoreID,
                s.Value,
                s.Criteria,
                s.EventID,
                s.ParticipantUserID,
                s.JudgeID,
                s.CreatedAt,
                u.Name as ParticipantName,
                j.Specialization as JudgeSpecialization,
                ju.Name as JudgeName
            FROM Scores s
            JOIN Users u ON s.ParticipantUserID = u.UserID
            JOIN Judges j ON s.JudgeID = j.JudgeID
            JOIN Users ju ON j.UserID = ju.UserID
            WHERE s.EventID = ?
            ORDER BY s.CreatedAt DESC
        `, [req.params.eventId]);

        res.json(scores);
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// GET /scores/participant/:participantId - Get scores for a participant
router.get('/participant/:participantId', isAuthenticated, async (req, res) => {
    try {
        const scores = await executeQuery(`
            SELECT 
                s.ScoreID,
                s.Value,
                s.Criteria,
                s.EventID,
                s.CreatedAt,
                e.Name as EventName,
                j.Specialization as JudgeSpecialization,
                ju.Name as JudgeName
            FROM Scores s
            JOIN Events e ON s.EventID = e.EventID
            JOIN Judges j ON s.JudgeID = j.JudgeID
            JOIN Users ju ON j.UserID = ju.UserID
            WHERE s.ParticipantUserID = ?
            ORDER BY s.EventID, s.Criteria
        `, [req.params.participantId]);

        res.json(scores);
    } catch (error) {
        console.error('Error fetching participant scores:', error);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// POST /scores - Submit a new score
router.post('/', isJudge, async (req, res) => {
    try {
        const { eventId, participantUserId, value, criteria } = req.body;

        // Validate required fields
        if (!eventId || !participantUserId || value === undefined || !criteria) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'Event ID, participant ID, value, and criteria are required'
            });
        }

        // Validate score value
        if (value < 0) {
            return res.status(400).json({
                error: 'Invalid score value',
                details: 'Score value must be non-negative'
            });
        }

        // Get judge ID for the current user
        const [judge] = await executeQuery(
            'SELECT JudgeID FROM Judges WHERE UserID = ?',
            [req.user.id]
        );

        if (!judge) {
            return res.status(403).json({
                error: 'Not authorized',
                details: 'User is not a judge'
            });
        }

        // Check if judge is assigned to this event
        const [assignment] = await executeQuery(`
            SELECT * FROM EventJudges 
            WHERE EventID = ? AND JudgeID = ? AND Status = 'assigned'
        `, [eventId, judge.JudgeID]);

        if (!assignment) {
            return res.status(403).json({
                error: 'Not authorized',
                details: 'Judge is not assigned to this event'
            });
        }

        // Check if participant is registered for the event
        const [registration] = await executeQuery(`
            SELECT * FROM Registrations 
            WHERE EventID = ? AND UserID = ?
        `, [eventId, participantUserId]);

        if (!registration) {
            return res.status(400).json({
                error: 'Invalid participant',
                details: 'Participant is not registered for this event'
            });
        }

        // Insert the score
        const result = await executeQuery(`
            INSERT INTO Scores (
                Value,
                Criteria,
                EventID,
                ParticipantUserID,
                JudgeID,
                CreatedAt
            ) VALUES (?, ?, ?, ?, ?, NOW())
        `, [value, criteria, eventId, participantUserId, judge.JudgeID]);

        res.status(201).json({
            message: 'Score submitted successfully',
            scoreId: result.insertId
        });
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({
            error: 'Failed to submit score',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /scores/:id - Update a score
router.put('/:id', isJudge, async (req, res) => {
    try {
        const { value, criteria } = req.body;
        const scoreId = req.params.id;

        // Get judge ID for the current user
        const [judge] = await executeQuery(
            'SELECT JudgeID FROM Judges WHERE UserID = ?',
            [req.user.id]
        );

        if (!judge) {
            return res.status(403).json({
                error: 'Not authorized',
                details: 'User is not a judge'
            });
        }

        // Check if score exists and belongs to this judge
        const [score] = await executeQuery(`
            SELECT * FROM Scores 
            WHERE ScoreID = ? AND JudgeID = ?
        `, [scoreId, judge.JudgeID]);

        if (!score) {
            return res.status(404).json({
                error: 'Score not found',
                details: 'Score does not exist or does not belong to this judge'
            });
        }

        // Update the score
        await executeQuery(`
            UPDATE Scores 
            SET Value = ?, 
                Criteria = ?,
                UpdatedAt = NOW()
            WHERE ScoreID = ?
        `, [value, criteria, scoreId]);

        res.json({
            message: 'Score updated successfully'
        });
    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({
            error: 'Failed to update score',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// DELETE /scores/:scoreId - Delete a score
router.delete('/:scoreId', isJudge, async (req, res) => {
    try {
        // Check if score exists and belongs to this judge
        const [score] = await executeQuery(`
            SELECT ScoreID 
            FROM Scores 
            WHERE ScoreID = ? AND JudgeID = ?
        `, [req.params.scoreId, req.user.judgeId]);

        if (!score) {
            return res.status(404).json({ error: 'Score not found or unauthorized' });
        }

        // Delete score
        await executeQuery('DELETE FROM Scores WHERE ScoreID = ?', [req.params.scoreId]);

        res.json({ message: 'Score deleted successfully' });
    } catch (error) {
        console.error('Error deleting score:', error);
        res.status(500).json({ error: 'Failed to delete score' });
    }
});

module.exports = router; 
```

## .\src\routes\sponsors.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// Get all sponsorship packages
router.get('/packages', async (req, res) => {
    try {
        const packages = await executeQuery('SELECT * FROM SponsorshipPackages ORDER BY Amount DESC');
        res.json(packages);
    } catch (error) {
        console.error('Error fetching sponsorship packages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sponsor's contract details
router.get('/:id/contract', async (req, res) => {
    try {
        const [contracts] = await executeQuery(`
            SELECT c.*, p.Category, p.Description, p.Benefits, p.Amount
            FROM SponsorshipContracts c
            JOIN SponsorshipPackages p ON c.PackageID = p.PackageID
            WHERE c.SponsorID = ?
            ORDER BY c.SignedDate DESC
        `, [req.params.id]);
        res.json(contracts);
    } catch (error) {
        console.error('Error fetching sponsor contract:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sign new sponsorship contract
router.post('/:id/contract', async (req, res) => {
    const { packageId, startDate, endDate, terms } = req.body;
    try {
        const [result] = await executeQuery(`
            INSERT INTO SponsorshipContracts 
            (SponsorID, PackageID, SignedDate, StartDate, EndDate, Terms)
            VALUES (?, ?, CURDATE(), ?, ?, ?)
        `, [req.params.id, packageId, startDate, endDate, terms]);

        // Update sponsor's contract status
        await executeQuery(`
            UPDATE Sponsors
            SET ContractStatus = 'Active',
                ContractStartDate = ?,
                ContractEndDate = ?
            WHERE SponsorID = ?
        `, [startDate, endDate, req.params.id]);

        res.status(201).json({
            message: 'Contract signed successfully',
            contractId: result.insertId
        });
    } catch (error) {
        console.error('Error signing contract:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sponsor's brand promotion details
router.get('/:id/promotions', async (req, res) => {
    try {
        const [sponsor] = await executeQuery(`
            SELECT SponsorID, Name, SponsorshipCategory, BrandPromotionDetails
            FROM Sponsors
            WHERE SponsorID = ?
        `, [req.params.id]);
        res.json(sponsor[0]);
    } catch (error) {
        console.error('Error fetching brand promotions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update brand promotion details
router.put('/:id/promotions', async (req, res) => {
    const { promotionDetails } = req.body;
    try {
        await executeQuery(`
            UPDATE Sponsors
            SET BrandPromotionDetails = ?
            WHERE SponsorID = ?
        `, [promotionDetails, req.params.id]);
        res.json({ message: 'Brand promotion details updated successfully' });
    } catch (error) {
        console.error('Error updating brand promotions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate sponsorship report
router.get('/reports/funds', async (req, res) => {
    try {
        const [report] = await executeQuery(`
            SELECT 
                s.SponsorshipCategory,
                COUNT(DISTINCT s.SponsorID) as SponsorCount,
                SUM(sp.Amount) as TotalFunds,
                GROUP_CONCAT(DISTINCT s.Name) as Sponsors
            FROM Sponsors s
            LEFT JOIN SponsorshipPayments sp ON s.SponsorID = sp.SponsorID
            GROUP BY s.SponsorshipCategory
            ORDER BY TotalFunds DESC
        `);
        res.json(report);
    } catch (error) {
        console.error('Error generating sponsorship report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all sponsors
router.get('/', async (req, res) => {
    try {
        const sponsors = await executeQuery(`
            SELECT s.*, 
                   COUNT(DISTINCT e.EventID) as EventCount,
                   SUM(p.Amount) as TotalContribution
            FROM Sponsors s
            LEFT JOIN Events e ON s.SponsorID = e.SponsorID
            LEFT JOIN SponsorshipContracts sc ON s.SponsorID = sc.SponsorID
            LEFT JOIN Payments p ON sc.ContractID = p.RelatedContractID
            GROUP BY s.SponsorID
            ORDER BY s.SponsorshipLevel DESC, s.Name ASC
        `);

        res.render('sponsors', {
            title: 'NASCON Sponsors',
            sponsors: sponsors,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error fetching sponsors:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading sponsors',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Get single sponsor
router.get('/:id', async (req, res) => {
    try {
        const sponsors = await executeQuery(`
            SELECT s.*, 
                   COUNT(DISTINCT e.EventID) as EventCount,
                   SUM(p.Amount) as TotalContribution
            FROM Sponsors s
            LEFT JOIN Events e ON s.SponsorID = e.SponsorID
            LEFT JOIN Payments p ON s.SponsorID = p.SponsorID
            WHERE s.SponsorID = ?
            GROUP BY s.SponsorID
        `, [req.params.id]);

        if (sponsors.length === 0) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }

        // Get sponsor's events
        const events = await executeQuery(`
            SELECT e.*, v.Name as VenueName
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            WHERE e.SponsorID = ?
            ORDER BY e.Date ASC
        `, [req.params.id]);

        // Get sponsor's payments
        const payments = await executeQuery(`
            SELECT *
            FROM Payments
            WHERE SponsorID = ?
            ORDER BY PaymentDate DESC
        `, [req.params.id]);

        res.json({
            ...sponsors[0],
            events,
            payments
        });
    } catch (error) {
        console.error('Error fetching sponsor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new sponsor (protected route)
router.post('/', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
        name,
        contact,
        email,
        phone,
        category,
        sponsorshipLevel,
        amount,
        website
    } = req.body;

    try {
        const result = await executeQuery(`
            INSERT INTO Sponsors (
                Name, Contact, Email, Phone, Category, 
                SponsorshipLevel, Amount, Website, Status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [name, contact, email, phone, category, sponsorshipLevel, amount, website]);

        res.status(201).json({
            message: 'Sponsor created successfully',
            sponsorId: result.insertId
        });
    } catch (error) {
        console.error('Error creating sponsor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update sponsor (protected route)
router.put('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
        name,
        contact,
        email,
        phone,
        category,
        sponsorshipLevel,
        amount,
        website,
        status
    } = req.body;

    try {
        const result = await executeQuery(`
            UPDATE Sponsors
            SET Name = ?, Contact = ?, Email = ?, Phone = ?, 
                Category = ?, SponsorshipLevel = ?, Amount = ?,
                Website = ?, Status = ?
            WHERE SponsorID = ?
        `, [name, contact, email, phone, category, sponsorshipLevel, amount, website, status, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }

        res.json({ message: 'Sponsor updated successfully' });
    } catch (error) {
        console.error('Error updating sponsor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete sponsor (protected route)
router.delete('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Check if sponsor has associated events
        const events = await executeQuery(`
            SELECT COUNT(*) as count
            FROM Events
            WHERE SponsorID = ?
        `, [req.params.id]);

        if (events[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete sponsor with associated events'
            });
        }

        const result = await executeQuery(`
            DELETE FROM Sponsors
            WHERE SponsorID = ?
        `, [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }

        res.json({ message: 'Sponsor deleted successfully' });
    } catch (error) {
        console.error('Error deleting sponsor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
```

## .\src\routes\teams.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// GET /teams - Get all teams
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const teams = await executeQuery(`
            SELECT 
                t.*,
                e.Name as EventName,
                u.Name as LeaderName,
                COUNT(tm.UserID) as MemberCount
            FROM Teams t
            JOIN Events e ON t.EventID = e.EventID
            JOIN Users u ON t.LeaderID = u.UserID
            LEFT JOIN TeamMembers tm ON t.TeamID = tm.TeamID
            GROUP BY t.TeamID
            ORDER BY t.CreatedAt DESC
        `);

        res.render('teams', {
            title: 'Teams',
            teams: teams,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).render('error', {
            message: 'Error loading teams',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /teams/:id - Get team details
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        // Get team details
        const [team] = await executeQuery(`
            SELECT 
                t.*,
                e.Name as EventName,
                u.Name as LeaderName,
                u.Email as LeaderEmail
            FROM Teams t
            JOIN Events e ON t.EventID = e.EventID
            JOIN Users u ON t.LeaderID = u.UserID
            WHERE t.TeamID = ?
        `, [req.params.id]);

        if (!team) {
            return res.status(404).render('error', {
                message: 'Team not found'
            });
        }

        // Get team members
        const members = await executeQuery(`
            SELECT 
                u.UserID,
                u.Name,
                u.Email,
                tm.Role,
                tm.Status,
                tm.JoinedAt
            FROM TeamMembers tm
            JOIN Users u ON tm.UserID = u.UserID
            WHERE tm.TeamID = ?
            ORDER BY tm.Role DESC, u.Name ASC
        `, [req.params.id]);

        res.render('team-details', {
            title: team.TeamName,
            team: team,
            members: members,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching team details:', error);
        res.status(500).render('error', {
            message: 'Error loading team details',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// POST /teams - Create new team
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { teamName, eventId } = req.body;

        // Validate required fields
        if (!teamName || !eventId) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        // Check if team name is already taken for this event
        const existingTeams = await executeQuery(
            'SELECT TeamID FROM Teams WHERE TeamName = ? AND EventID = ?',
            [teamName, eventId]
        );

        if (existingTeams.length > 0) {
            return res.status(400).json({
                error: 'Team name already exists for this event'
            });
        }

        // Enforce team size: leader must add at least one more member later (2-3 total)
        // We'll allow creation, but warn if only one member
        // Team member addition will enforce the upper limit

        // Create team
        const result = await executeQuery(`
            INSERT INTO Teams (TeamName, EventID, LeaderID)
            VALUES (?, ?, ?)
        `, [teamName, eventId, req.user.id]);

        // Add leader as team member
        await executeQuery(`
            INSERT INTO TeamMembers (TeamID, UserID, Role)
            VALUES (?, ?, 'Leader')
        `, [result.insertId, req.user.id]);

        res.status(201).json({
            message: 'Team created successfully. Remember: teams must have 2-3 members.',
            teamId: result.insertId
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({
            error: 'Failed to create team'
        });
    }
});

// POST /teams/:id/members - Add team member
router.post('/:id/members', isAuthenticated, async (req, res) => {
    try {
        const { userId, role = 'Member' } = req.body;

        // Check if user is team leader
        const [team] = await executeQuery(
            'SELECT LeaderID FROM Teams WHERE TeamID = ?',
            [req.params.id]
        );

        if (!team || team.LeaderID !== req.user.id) {
            return res.status(403).json({
                error: 'Only team leader can add members'
            });
        }

        // Check current team size (active members)
        const [{ count }] = await executeQuery(
            'SELECT COUNT(*) as count FROM TeamMembers WHERE TeamID = ? AND Status = "active"',
            [req.params.id]
        );
        if (count >= 3) {
            return res.status(400).json({
                error: 'Team already has maximum allowed members (3)'
            });
        }

        // Check if user is already a member
        const existingMembers = await executeQuery(
            'SELECT UserID FROM TeamMembers WHERE TeamID = ? AND UserID = ?',
            [req.params.id, userId]
        );

        if (existingMembers.length > 0) {
            return res.status(400).json({
                error: 'User is already a team member'
            });
        }

        // Add member
        await executeQuery(`
            INSERT INTO TeamMembers (TeamID, UserID, Role)
            VALUES (?, ?, ?)
        `, [req.params.id, userId, role]);

        res.status(201).json({
            message: 'Member added successfully'
        });
    } catch (error) {
        console.error('Error adding team member:', error);
        res.status(500).json({
            error: 'Failed to add team member'
        });
    }
});

// PUT /teams/:id/members/:userId - Update member status
router.put('/:id/members/:userId', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;

        // Check if user is team leader
        const [team] = await executeQuery(
            'SELECT LeaderID FROM Teams WHERE TeamID = ?',
            [req.params.id]
        );

        if (!team || team.LeaderID !== req.user.id) {
            return res.status(403).json({
                error: 'Only team leader can update member status'
            });
        }

        // Update member status
        await executeQuery(`
            UPDATE TeamMembers
            SET Status = ?
            WHERE TeamID = ? AND UserID = ?
        `, [status, req.params.id, req.params.userId]);

        res.json({
            message: 'Member status updated successfully'
        });
    } catch (error) {
        console.error('Error updating member status:', error);
        res.status(500).json({
            error: 'Failed to update member status'
        });
    }
});

// DELETE /teams/:id/members/:userId - Remove team member
router.delete('/:id/members/:userId', isAuthenticated, async (req, res) => {
    try {
        // Check if user is team leader or the member being removed
        const [team] = await executeQuery(
            'SELECT LeaderID FROM Teams WHERE TeamID = ?',
            [req.params.id]
        );

        if (!team || (team.LeaderID !== req.user.id && req.params.userId !== req.user.id)) {
            return res.status(403).json({
                error: 'Unauthorized to remove team member'
            });
        }

        // Remove member
        await executeQuery(`
            DELETE FROM TeamMembers
            WHERE TeamID = ? AND UserID = ?
        `, [req.params.id, req.params.userId]);

        res.json({
            message: 'Member removed successfully'
        });
    } catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({
            error: 'Failed to remove team member'
        });
    }
});

module.exports = router; 
```

## .\src\routes\venues.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, hasPrivilege } = require('../middleware/auth');
const { venueValidation } = require('../middleware/venueValidation');

// GET /venues - Render venues page
router.get('/', async (req, res) => {
    try {
        // Fetch venues from database
        const venuesQuery = `
            SELECT 
                v.*,
                COUNT(DISTINCT e.EventID) as EventCount
            FROM Venues v
            LEFT JOIN Events e ON v.VenueID = e.VenueID
            GROUP BY v.VenueID
            ORDER BY v.Name ASC
        `;
        const venues = await executeQuery(venuesQuery);

        res.render('venues', {
            title: 'NASCON Venues',
            venues: venues,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error fetching venues:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading venues',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.session.user || null
        });
    }
});

// GET /venues/api/venues - Get all venues
router.get('/api/venues', async (req, res) => {
    try {
        const { type, capacity, availability } = req.query;
        let query = `
            SELECT 
                v.*,
                COUNT(DISTINCT e.EventID) as EventCount
            FROM Venues v
            LEFT JOIN Events e ON v.VenueID = e.VenueID
            WHERE 1=1
        `;
        
        const params = [];
        
        if (type) {
            query += ` AND v.VenueType = ?`;
            params.push(type);
        }
        
        if (capacity) {
            query += ` AND v.Capacity >= ?`;
            params.push(capacity);
        }
        
        if (availability) {
            query += ` AND v.Status = ?`;
            params.push(availability);
        }
        
        query += ` GROUP BY v.VenueID ORDER BY v.Name ASC`;
        
        const venues = await executeQuery(query, params);
        res.json(venues);
    } catch (error) {
        console.error('Error fetching venues:', error);
        res.status(500).json({ 
            error: 'Failed to fetch venues',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /venues/:id - Get single venue
router.get('/:id', async (req, res) => {
    try {
        const venueQuery = `
            SELECT 
                v.*,
                COUNT(DISTINCT e.EventID) as EventCount,
                GROUP_CONCAT(DISTINCT e.Name) as UpcomingEvents
            FROM Venues v
            LEFT JOIN Events e ON v.VenueID = e.VenueID
            WHERE v.VenueID = ?
            GROUP BY v.VenueID
        `;
        const venues = await executeQuery(venueQuery, [req.params.id]);

        if (venues.length === 0) {
            return res.status(404).json({ error: 'Venue not found' });
        }

        res.json(venues[0]);
    } catch (error) {
        console.error('Error fetching venue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /venues - Create new venue (protected route)
router.post('/', isAuthenticated, hasPrivilege('venues', 'create'), venueValidation, async (req, res) => {
    try {
        const {
            name,
            address,
            location,
            capacity,
            availability,
            facilities,
            mapEmbedURL,
            description,
            contactPerson,
            contactEmail,
            contactPhone,
            venueType,
            status,
            equipment,
            restrictions
        } = req.body;

        const [result] = await executeQuery(`
            INSERT INTO Venues (
                Name, Address, Location, Capacity, Availability,
                Facilities, MapEmbedURL, Description, ContactPerson,
                ContactEmail, ContactPhone, VenueType, Status,
                Equipment, Restrictions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name,
            address,
            location,
            capacity,
            availability,
            facilities,
            mapEmbedURL,
            description,
            contactPerson,
            contactEmail,
            contactPhone,
            venueType,
            status || 'Available',
            equipment,
            restrictions
        ]);

        res.status(201).json({
            message: 'Venue created successfully',
            venueId: result.insertId
        });
    } catch (error) {
        console.error('Error creating venue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /venues/:id - Update venue (protected route)
router.put('/:id', isAuthenticated, hasPrivilege('venues', 'update'), venueValidation, async (req, res) => {
    try {
        const {
            name,
            address,
            location,
            capacity,
            availability,
            facilities,
            mapEmbedURL,
            description,
            contactPerson,
            contactEmail,
            contactPhone,
            venueType,
            status,
            equipment,
            restrictions
        } = req.body;

        const [result] = await executeQuery(`
            UPDATE Venues
            SET Name = ?, Address = ?, Location = ?, Capacity = ?,
                Availability = ?, Facilities = ?, MapEmbedURL = ?,
                Description = ?, ContactPerson = ?, ContactEmail = ?,
                ContactPhone = ?, VenueType = ?, Status = ?,
                Equipment = ?, Restrictions = ?
            WHERE VenueID = ?
        `, [
            name,
            address,
            location,
            capacity,
            availability,
            facilities,
            mapEmbedURL,
            description,
            contactPerson,
            contactEmail,
            contactPhone,
            venueType,
            status,
            equipment,
            restrictions,
            req.params.id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Venue not found' });
        }

        res.json({ message: 'Venue updated successfully' });
    } catch (error) {
        console.error('Error updating venue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /venues/:id - Delete venue (protected route)
router.delete('/:id', isAuthenticated, hasPrivilege('venues', 'delete'), async (req, res) => {
    try {
        // Check if venue has associated events
        const events = await executeQuery(`
            SELECT COUNT(*) as count
            FROM Events
            WHERE VenueID = ?
        `, [req.params.id]);

        if (events[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete venue with associated events'
            });
        }

        const [result] = await executeQuery(`
            DELETE FROM Venues
            WHERE VenueID = ?
        `, [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Venue not found' });
        }

        res.json({ message: 'Venue deleted successfully' });
    } catch (error) {
        console.error('Error deleting venue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 
```

## .\src\routes\workshops.js

```js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /workshops - Render workshops page
router.get('/', (req, res) => {
    res.render('workshops', {
        title: 'NASCON Workshops & Guest Speakers',
        user: req.session.user || null
    });
});

// GET /workshops/api/workshops - Get all workshops
router.get('/api/workshops', async (req, res) => {
    try {
        const query = `
            SELECT 
                WorkshopID, 
                Title, 
                Description, 
                Instructor, 
                Date, 
                Time, 
                Venue, 
                Capacity 
            FROM Workshops 
            ORDER BY Date, Time
        `;

        const workshops = await executeQuery(query);
        
        // Add sample data if no workshops are found
        if (workshops.length === 0) {
            workshops.push({
                WorkshopID: 1,
                Title: "Introduction to Web Development",
                Description: "Learn the basics of HTML, CSS, and JavaScript",
                Instructor: "Dr. John Smith",
                Date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                Time: "10:00 AM",
                Venue: "Main Auditorium",
                Capacity: 50
            });
        }
        
        res.json(workshops);
    } catch (error) {
        console.error('Error fetching workshops:', error);
        res.status(500).json({ 
            error: 'Failed to fetch workshops',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /workshops/api/speakers - Get all guest speakers
router.get('/api/speakers', async (req, res) => {
    try {
        const query = `
            SELECT 
                SpeakerID, 
                Name, 
                PhotoURL, 
                Bio, 
                Topic, 
                SessionDate, 
                SessionTime, 
                SessionVenue 
            FROM Speakers 
            ORDER BY SessionDate, SessionTime
        `;

        const speakers = await executeQuery(query);
        
        // Add sample data if no speakers are found
        if (speakers.length === 0) {
            speakers.push({
                SpeakerID: 1,
                Name: "Dr. Sarah Johnson",
                PhotoURL: "/images/speakers/sample-speaker.jpg",
                Bio: "Dr. Sarah Johnson is a renowned expert in Artificial Intelligence with over 15 years of experience.",
                Topic: "The Future of AI in Education",
                SessionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                SessionTime: "2:00 PM",
                SessionVenue: "Conference Hall"
            });
        }
        
        res.json(speakers);
    } catch (error) {
        console.error('Error fetching speakers:', error);
        res.status(500).json({ 
            error: 'Failed to fetch speakers',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 
```

## .\src\utils\passwordValidator.js

```js
/**
 * Validates password complexity
 * @param {string} password - The password to validate
 * @returns {boolean} - True if password meets requirements, false otherwise
 */
function passwordValidator(password) {
    // Password must be at least 8 characters long
    if (password.length < 8) {
        return false;
    }

    // Password must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return false;
    }

    // Password must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return false;
    }

    // Password must contain at least one number
    if (!/[0-9]/.test(password)) {
        return false;
    }

    // Password must contain at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return false;
    }

    return true;
}

module.exports = passwordValidator; 
```

