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