const express = require('express');
const router = express.Router();

const Document = require('../models/Document');
const DocumentService = require('../services/DocumentService');

const documentService = new DocumentService();

// Display all files with optional sorting
router.get('/', async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'name'; // Default sort by name
    const files = await documentService.getAllFilesSorted(sortBy);

    if (!files || files.length === 0) {
      return res.render('uploadForm', { message: 'No files available for display.' });
    }

    return res.render('uploadForm', { files: files });
  } catch (error) {
    console.error(error);
    return res.status(500).render('uploadForm', { message: 'Internal Server Error while fetching files.' });
  }
});

// Handle file uploads with category
router.post('/upload', async (req, res) => {
  try {
    const file = req.file; // The uploaded file
    const category = req.body.category; // Document category from the form

    // Check if a category is provided
    if (!category) {
      return res.render('uploadForm', { message: 'Category is required for file upload.' });
    }

    // Check if a file is uploaded
    if (!file) {
      return res.render('uploadForm', { message: 'No file uploaded. Please select a file.' });
    }

    // Save the file with category
    const uploadedDocument = await documentService.saveFile(file, category);

    return res.render('uploadForm', { message: 'File uploaded successfully!', files: [uploadedDocument] });
  } catch (error) {
    console.error(error);
    return res.status(500).render('uploadForm', { message: 'Internal Server Error while uploading file.' });
  }
});

// Download a specific file
router.get('/download/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const document = await documentService.getFile(id);

    if (!document) {
      return res.status(404).send('File not found.');
    }

    res.setHeader('Content-Disposition', 'attachment; filename=' + document.name);
    res.setHeader('Content-Type', document.type);
    return res.send(document.data);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error while fetching file.');
  }
});

// Delete a file
router.post('/delete', async (req, res) => {
  const id = req.body.id;
  try {
    const deleted = await documentService.deleteFile(id);

    if (!deleted) {
      return res.status(404).render('uploadForm', { message: 'File not found to delete.' });
    }

    return res.render('uploadForm', { message: 'File deleted successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).render('uploadForm', { message: 'Internal Server Error while deleting file.' });
  }
});

module.exports = router;
