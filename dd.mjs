import express from 'express';
import mysql from 'mysql2';
import { fileURLToPath } from 'url';
import path from 'path';

// Create a connection pool to the MySQL database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'advproject',  // Ensure the database name is correct
}).promise();

// Async function to fetch data from the "files" table
async function getFil() {
    try {
        const [rows] = await pool.query('SELECT * FROM files');
        return rows;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Define the Express router
const router = express.Router();

// Route to fetch files from the database (for admin view)
router.get('/admin', async (req, res) => {
    try {
        const files = await getFil();  // Fetch all files
        res.render('admin-manage-files', { files });  // Pass the files to the view
    } catch (error) {
        res.status(500).send("Failed to fetch files.");
    }
});

// API route to fetch files (search and sort functionality)
router.get('/api/files', async (req, res) => {
    const { search, sortBy } = req.query;  // Grab search and sort parameters from query

    // Construct the query based on provided search and sort parameters
    let query = 'SELECT * FROM files'; // Basic query to fetch all files

    if (search) {
        // If a search term is provided, filter by file name or type
        query += ` WHERE name LIKE '%${search}%' OR type LIKE '%${search}%'`;
    }

    if (sortBy) {
        // If a sorting parameter is provided, order the results
        query += ` ORDER BY ${sortBy}`;
    }

    try {
        const [rows] = await pool.query(query); // Execute the query using async/await
        res.json(rows); // Send the resulting rows as JSON response
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).send('Error fetching files from the database.'); // Error handling
    }
});

export default router;
