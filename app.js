const express = require('express');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

// Custom imports
const DocumentService = require('./service/DocumentService'); // Handles DB and file operations
const fileRoutes = require('./routes/files'); // Routes for file management

// Load environment variables
dotenv.config();

// Initialize app and services
const app = express();
const documentService = new DocumentService();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Static assets (e.g., CSS, JS, images)

// Routes
app.use('/api/files', fileRoutes); // File management routes

// Serve upload form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'uploadForm.html'));
});

// File upload configuration
const storage = multer.memoryStorage();
const maxFileSize = process.env.MAX_FILE_SIZE || 10 * 1024 * 1024; // Default 10MB

const upload = multer({
  storage: storage,
  limits: { fileSize: maxFileSize },
}).single('file');

// File upload endpoint
app.post('/upload', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      const errorMessage = err instanceof multer.MulterError ? err.message : 'File upload error.';
      return res.status(400).json({ success: false, message: errorMessage });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const category = req.body.category;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    try {
      const fileMetadata = await documentService.saveFile(req.file, category);
      res.status(200).json({
        success: true,
        message: 'File uploaded successfully.',
        fileName: fileMetadata.name,
        category: category,
        fileId: fileMetadata.id,
      });
    } catch (error) {
      console.error('Error saving file:', error);
      res.status(500).json({ success: false, message: 'Error saving file metadata.' });
    }
  });
});

// Document validation endpoint (using third-party API)
app.post('/validate', async (req, res) => {
  const { fileId } = req.body; // Assuming file ID is passed in request body
  try {
    const fileData = await documentService.getFile(fileId); // Retrieve file data
    if (!fileData) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Send file data to the third-party API
    const response = await axios.post('https://thirdpartyapi.com/validate', {
      fileData: fileData.file_data, // Send file content
    });

    res.status(200).json({
      success: true,
      message: 'Validation successful.',
      validationResult: response.data,
    });
  } catch (error) {
    console.error('Error validating document:', error);
    res.status(500).json({ success: false, message: 'Validation failed.' });
  }
});

// File download endpoint
app.get('/api/files/:id/download', async (req, res) => {
  const fileId = req.params.id;
  try {
    await documentService.downloadFile(fileId, res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Error downloading file.');
  }
});

// File deletion endpoint
app.post('/delete', async (req, res) => {
  const { id } = req.body;
  try {
    const file = await documentService.getFile(id);
    if (!file) {
      return res.status(404).send('File not found.');
    }

    await documentService.deleteFile(id);
    res.send('File and metadata deleted successfully.');
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).send('Error deleting file.');
  }
});

app.get('/api/files/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const files = await documentService.getFilesByCategory(category);
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching files by category' });
  }
});


// Server initialization
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
