const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { registerUser, loginUser } = require('./Controller/auth.js');
const fileRoutes = require('./routes/files'); // File management routes
const UserService = require('./service/UserService');

dotenv.config();

// Initialize app
const app = express();
const userService = new UserService();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Static assets (e.g., CSS, JS, images)

// Authentication routes
// Register User Endpoint
app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        // Check if the email already exists
        const [existingUser] = await userService.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, error: 'Email is already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the user into the database
        const query = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
        await userService.promise().query(query, [username, email, hashedPassword, role]);

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error registering user:', err);
        return res.status(500).json({ success: false, error: 'Error registering user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const result = await loginUser(username, password);
        res.json({ message: 'Login successful', token: result.token, user: result.user });
    } catch (err) {
        res.status(401).json({ message: err });
    }
});

// File management routes
app.use('/api/files', fileRoutes); // File management routes (assuming fileRoutes is defined)


// Server initialization
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app; // Correct export
