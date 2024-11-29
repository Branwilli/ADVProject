const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

class UserService {
  constructor() {
    // Create a connection pool to the MySQL database
    this.db = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'Javannio137.',
      database: 'user_authentication'
    }).promise();
  }

  // Method to register a user
  async registerUser(username, email, password, role) {
    try {
      // Check if the email already exists
      const [existingUser] = await this.db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
        return { success: false, error: 'Email is already registered' };
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('Hashed password:', hashedPassword); // Log hashed password

      // Insert the user into the database
      const query = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
      const values = [username, email, hashedPassword, role];
      console.log('Executing query:', query, 'With values:', values); // Log the query

      const [result] = await this.db.execute(query, values);
      return { success: true, userId: result.insertId };
    } catch (err) {
      console.error('Error registering user:', err);
      throw new Error('Error saving user to database');
    }
  }

  // Method to login a user
  async loginUser(username, password) {
    try {
      // Query the database to find the user by username
      const [user] = await this.db.execute('SELECT * FROM users WHERE username = ?', [username]);

      if (user.length === 0) {
        throw new Error('Invalid username or password');
      }

      // Compare the provided password with the hashed password stored in the database
      const passwordMatch = await bcrypt.compare(password, user[0].password_hash);
      if (!passwordMatch) {
        throw new Error('Invalid username or password');
      }

      // Generate a JWT token if authentication is successful
      const token = jwt.sign({ userId: user[0].id, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return { token, user: user[0] };
    } catch (err) {
      console.error('Error logging in user:', err);
      throw new Error('Error logging in user');
    }
  }
}

module.exports = UserService;
