const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const xlsx = require('xlsx');
const { isAuthenticated, checkPlan } = require('../middleware/auth');
const upload = require('../middleware/upload');
const File = require('../models/File');
const User = require('../models/User');

// Upload
router.post('/upload', isAuthenticated, checkPlan(['gold', 'diamond']), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = new File({
            user: req.session.user.id,
            filename: req.file.filename,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            path: req.file.path
        });

        await file.save();
        
        const user = await User.findById(req.session.user.id);
        if (user) {
            user.filesUploaded += 1;
            user.storageUsed += req.file.size;
            await user.save();
        }

        res.json({ 
            success: true, 
            message: 'File uploaded successfully',
            file: { 
                id: file._id, 
                name: file.originalName, 
                size: file.fileSize 
            } 
        });
    } catch (error) {
        console.error('Upload error:', error.message);
        res.status(500).json({ error: 'File upload failed. Please try again.' });
    }
});

// Analyze PDF
router.post('/analyze-pdf', isAuthenticated, checkPlan(['gold', 'diamond']), upload.single('file'), async (req, res) => {
    try {
        if (!req.file || path.extname(req.file.originalname).toLowerCase() !== '.pdf') {
            return res.status(400).json({ error: 'Please upload a PDF file' });
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        
        // Clean up uploaded file after analysis
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
            console.error('PDF cleanup error:', cleanupError.message);
        }
        
        res.json({ 
            success: true,
            text: pdfData.text ? pdfData.text.substring(0, 5000) : 'No text found',
            pages: pdfData.numpages || 0,
            info: pdfData.info || {}
        });
    } catch (error) {
        console.error('PDF analysis error:', error.message);
        res.status(500).json({ error: 'PDF analysis failed. Please try a different file.' });
    }
});

// Analyze Excel
router.post('/analyze-excel', isAuthenticated, checkPlan(['gold', 'diamond']), upload.single('file'), async (req, res) => {
    try {
        if (!req.file || !['.xlsx', '.xls'].includes(path.extname(req.file.originalname).toLowerCase())) {
            return res.status(400).json({ error: 'Please upload an Excel file (.xlsx or .xls)' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
            console.error('Excel cleanup error:', cleanupError.message);
        }
        
        res.json({ 
            success: true,
            sheets: workbook.SheetNames,
            data: data.slice(0, 100),
            rowCount: data.length
        });
    } catch (error) {
        console.error('Excel analysis error:', error.message);
        res.status(500).json({ error: 'Excel analysis failed. Please try a different file.' });
    }
});

// List Vault Files
router.get('/vault', isAuthenticated, checkPlan(['diamond']), async (req, res) => {
    try {
        const files = await File.find({ user: req.session.user.id }).sort({ uploadedAt: -1 });
        res.json({ success: true, files });
    } catch (error) {
        console.error('Vault load error:', error.message);
        res.status(500).json({ error: 'Failed to load vault files.' });
    }
});

// Delete File
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, user: req.session.user.id });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        if (fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (unlinkError) {
                console.error('File delete error:', unlinkError.message);
            }
        }
        
        await file.deleteOne();
        res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
        console.error('File delete error:', error.message);
        res.status(500).json({ error: 'Failed to delete file.' });
    }
});

module.exports = router;