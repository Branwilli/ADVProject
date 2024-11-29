const express = require('express');
const Document = require('../models/Document');
const DocumentService = require('../services/DocumentService');

const router = express.Router();
const documentService = new DocumentService();

router.get('/admin', async (req, res) => {
    try {
        const files = await documentService.getAllFiles();
        res.render('admin-manage-files', { files });
    } catch (error) {
        res.status(500).send("Failed to fetch files.");
    }
});

router.post('/admin/update', async (req, res) => {
    const { id, name, type } = req.body;
    try {
        const document = await documentService.getFile(id);
        if (document) {
            document.name = name;
            document.type = type;
            await documentService.saveUpdatedFile(document);
            res.send("File updated successfully!");
        } else {
            res.status(404).send("Document not found!");
        }
    } catch (error) {
        res.status(500).send("Failed to update the file.");
    }
});

router.post('/admin/delete', async (req, res) => {
    const { id } = req.body;
    try {
        await documentService.deleteFile(id);
        res.send("File deleted successfully!");
    } catch (error) {
        res.status(500).send("Failed to delete the file.");
    }
});

module.exports = router;