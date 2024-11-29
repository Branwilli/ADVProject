const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const UserService = require('../service/UserService');

// Register User Function
async function registerUser(username, email, password, role) {
  try {
      // Check if the email already exists
      const [existingUser] = await UserService.promise().query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
          return { success: false, error: 'Email is already registered' };
      }

      const user = {
        username,
        email,
        password_hash: null,
        role
      };
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('Hashed password:', hashedPassword); // Log hashed password

      // Insert the user into the database
      const query = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
      const values = [username, email, hashedPassword, role];
      console.log('Executing query:', query, 'With values:', values); // Log the query

      await UserService.promise().query(query, values);
      return { success: true };
  } catch (err) {
      console.error('Error registering user:', err);
      return { success: false, error: 'Error registering user' };
  }
}

// Login User Function
async function loginUser(username, password, callback) {
  try {
    // Query the database to find the user by username
    const [user] = await UserService.promise().query('SELECT * FROM users WHERE username = ?', [username]);

    if (user.length === 0) {
      return callback('Invalid username or password', null);
    }

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user[0].password_hash);
    if (!passwordMatch) {
      return callback('Invalid username or password', null);
    }

    // Generate a JWT token if authentication is successful
    const token = jwt.sign({ userId: user[0].id, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    callback(null, { token, user: user[0] });
  } catch (error) {
    callback(error.message, null);
  }
}

module.exports = { registerUser, loginUser };
