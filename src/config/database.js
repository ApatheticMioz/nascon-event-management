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