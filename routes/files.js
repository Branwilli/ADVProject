const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const DocumentService = require('../service/DocumentService'); // Import DocumentService

// Initialize the DocumentService
const documentService = new DocumentService();

// Express route to fetch files with optional search term, sorting, and ordering
router.get('/', async (req, res) => {
    const searchTerm = req.query.search || ''; // Get the search term from query params
    const { sort, order } = req.query; // Get sort and order from query params

    try {
        // Fetch files using DocumentService with optional search term
        const files = await documentService.getAllFiles(searchTerm); 
        console.log('Fetched files:', files); // Log fetched files for debugging

        // Only sort if `sort` and `order` are provided
        if (sort && order) {
            // Ensure that the `sort` column exists in the files and that `order` is valid
            if (files.length > 0 && files[0].hasOwnProperty(sort)) {
                // Apply sorting based on the type of data (string, number, or Date)
                files.sort((a, b) => {
                    const aValue = a[sort];
                    const bValue = b[sort];

                    if (order === 'asc') {
                        // Sorting for 'uploadedtime' (Date object)
                        if (sort === 'uploadedtime') {
                            const aTime = new Date(aValue);
                            const bTime = new Date(bValue);
                            return aTime - bTime; // Compare by timestamp difference
                        }

                        // If the values are numbers, compare numerically
                        if (typeof aValue === 'number' && typeof bValue === 'number') {
                            return aValue - bValue;
                        }

                        // If the values are strings, compare lexicographically
                        if (typeof aValue === 'string' && typeof bValue === 'string') {
                            return aValue.localeCompare(bValue);
                        }
                    } else if (order === 'desc') {
                        // Sorting for 'uploadedtime' (Date object) in descending order
                        if (sort === 'uploadedtime') {
                            const aTime = new Date(aValue);
                            const bTime = new Date(bValue);
                            return bTime - aTime; // Compare by timestamp difference in reverse
                        }

                        // If the values are numbers, compare numerically in descending order
                        if (typeof aValue === 'number' && typeof bValue === 'number') {
                            return bValue - aValue;
                        }

                        // If the values are strings, compare lexicographically in descending order
                        if (typeof aValue === 'string' && typeof bValue === 'string') {
                            return bValue.localeCompare(aValue);
                        }
                    }

                    // Default: if both are not comparable (e.g., mixed types), return 0 (no change)
                    return 0;
                });

                console.log('Sorted files:', files); // Log sorted files for debugging
            } else {
                return res.status(400).json({ message: `Invalid sort field: ${sort}` });
            }
        }

        // Send the files in the response
        res.json(files);
    } catch (error) {
        console.error('Error fetching files from the database:', error);
        res.status(500).json({ message: 'Error fetching files from the database.' });
    }
});

router.get('/api/files/:fileId/download', async (req, res) => {
    const fileId = req.params.fileId;
    // Retrieve file from database or storage
    const file = await documentService.getFile(fileId);

    if (!file) {
        return res.status(404).json({ message: 'File not found.' });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', file.file_data.length);

    // Send file data as a stream or buffer
    res.send(file.file_data); // Assuming file.file_data contains the binary content

    // Or you can use streams if needed for large files
    // res.sendFile(path.join(__dirname, 'path-to-files', file.name));
});

// Express route to fetch files by category
router.get('/api/files/category/:category', async (req, res) => {
    const { category } = req.params;  // Get the category from the URL params

    try {
        // Fetch files by category using the DocumentService
        const files = await documentService.getFilesByCategory(category);
        
        if (files.length === 0) {
            return res.status(404).json({ message: `No files found in category: ${category}` });
        }

        // Return the files in the response
        res.json(files);
    } catch (error) {
        console.error('Error fetching files by category:', error);
        res.status(500).json({ message: 'Error fetching files by category.' });
    }
});
   

// Delete a file
router.delete('/:id', async (req, res) => {
    const fileId = req.params.id;
    console.log(`Delete request for file with ID: ${fileId}`);

    try {
        // Fetch the file metadata to check if it exists
        const file = await documentService.getFile(fileId);
        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Step 1: Delete the file metadata from the database
        await documentService.deleteFile(fileId);

        // Step 2: Delete the physical file from the server
        const filePath = path.join(__dirname, 'uploads', `${fileId}.pdf`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Remove the physical file
            console.log(`File deleted: ${filePath}`);
        }

        // Respond with a success message
        res.status(200).json({ message: 'File deleted successfully.' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete the file.' });
    }
});

module.exports = router;
