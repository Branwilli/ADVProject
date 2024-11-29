const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

class DocumentService {
  constructor() {
    // Create a connection pool to the MySQL database
    this.db = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '.',
      database: 'advproject'
    }).promise();
  }
  
  // Method to save file data and metadata to the database
  async saveFile(file, category) {
    if (!category) {
      throw new Error('Category is required for file upload.');
    }
  
    const fileData = file.buffer;  // `file.buffer` is the binary data when using `multer` in memory storage
  
    const document = {
      name: file.originalname,
      type: file.mimetype,
      category: category,
      file_size: file.size,
      uploadedtime: new Date(),
      file_data: fileData  // Store the binary data in the database
    };
  
    const query = 'INSERT INTO files (name, type, category, file_size, uploadedtime, file_data) VALUES (?, ?, ?, ?, ?, ?)';
  
    try {
      const [result] = await this.db.execute(query, Object.values(document));
      console.log('File metadata saved:', result);
      return { ...document, id: result.insertId };  // Return metadata with the insert ID
    } catch (err) {
      console.error('Error inserting file metadata:', err);
      throw new Error('Error saving file metadata to database');
    }
  }
  
  // Method to get file metadata by ID
  async getFile(id) {
    const query = 'SELECT * FROM files WHERE id = ?';
  
    try {
      const [result] = await this.db.execute(query, [id]);
      return result[0] || null;  // Return the file metadata if found, otherwise null
    } catch (err) {
      console.error('Error fetching file metadata:', err);
      throw new Error('Error fetching file metadata');
    }
  }

  // Method to update file data for records with null file data (typically for files that were originally stored on disk)
  async updateFileData() {
    const [files] = await this.db.execute('SELECT id, name FROM files WHERE file_data IS NULL');
  
    if (files.length === 0) {
      console.log('No files without data to update');
      return;
    }
  
    for (let file of files) {
      const filePath = path.join(uploadDir, file.name); // Ensure 'uploadDir' is correctly set
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath); // Read the file's binary data
  
        // Log the file data to see if it's being read correctly
        console.log(`Reading file data for: ${file.name}`);
  
        await this.db.execute('UPDATE files SET file_data = ? WHERE id = ?', [fileData, file.id]);
  
        console.log(`File data updated for file: ${file.name}`);
      } else {
        console.log(`File not found: ${file.name}`);
      }
    }
  }
  
  // Method to fetch all files from the database, optionally filtering by a search term
  async getAllFiles(searchTerm = '') {
    let query = 'SELECT * FROM files';
    const params = [];
  
    if (searchTerm) {
      query += ' WHERE name LIKE ? OR type LIKE ? OR category LIKE ?';
      const likeTerm = `%${searchTerm}%`;
      params.push(likeTerm, likeTerm, likeTerm);
    }
  
    try {
      const [result] = await this.db.execute(query, params);
      return result;
    } catch (err) {
      console.error('Error fetching file metadata:', err);
      throw new Error('Error fetching file metadata');
    }
  }
  
  // Method to delete a file from the database based on its ID
  async deleteFile(id) {
    const query = 'DELETE FROM files WHERE id = ?';
  
    try {
      const [result] = await this.db.execute(query, [id]);
      if (result.affectedRows === 0) {
        throw new Error('File not found.');
      }
      console.log('File deleted successfully');
    } catch (err) {
      console.error('Error deleting file metadata:', err);
      throw new Error('Error deleting file metadata from database');
    }
  }
  
  async downloadFile(id, res) {
    const query = 'SELECT name, type, file_size, uploadedtime, file_data FROM files WHERE id = ?';
  
    try {
      const [result] = await this.db.execute(query, [id]);
  
      // Check if the file exists in the database
      if (!result[0]) {
        throw new Error('File not found.');
      }
  
      const file = result[0];
  
      // Set the response headers for the download
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.setHeader('Content-Type', file.type);
      res.setHeader('Content-Length', file.file_size);
  
      // Send the file data (binary content) back to the client
      res.send(file.file_data);  // This sends the binary data as the response body
  
      console.log(`File ${file.name} downloaded successfully.`);
    } catch (err) {
      console.error('Error fetching file metadata:', err);
      throw new Error('Error fetching file metadata');
    }
  }


  // Method to fetch files by category
  async getFilesByCategory(category) {
    const query = 'SELECT * FROM files WHERE category = ?';
    try {
        const [result] = await this.db.execute(query, [category]);
        return result;
    } catch (err) {
        console.error('Error fetching files by category:', err);
        throw new Error('Error fetching files by category from the database');
    }
  }

  
}

module.exports = DocumentService;
