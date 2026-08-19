const express = require('express');
const router = express.Router();
const { generateUploadUrl, generateDownloadUrl } = require('../config/s3');
const File = require('../models/File');

/**
 * @route   POST /api/files/upload-url
 * @desc    Generate a presigned S3 upload URL and log file metadata in MongoDB
 * @access  Public (for now)
 */
router.post('/upload-url', async (req, res) => {
  try {
    const { originalName, downloadLimit, expiryHours } = req.body;

    // Validation
    if (!originalName) {
      return res.status(400).json({ error: 'Original filename is required.' });
    }

    // 1. Generate the secure AWS S3 Presigned URL
    const { uploadUrl, s3Key } = await generateUploadUrl(originalName);

    // 2. Calculate the exact expiration timestamp (default to 24 hours if not provided)
    const hoursToLive = expiryHours ? parseInt(expiryHours) : 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hoursToLive);

    // 3. Create and save the file record into MongoDB
    const newFile = new File({
      s3Key,
      originalName,
      downloadLimit: downloadLimit ? parseInt(downloadLimit) : 0,
      expiresAt
    });

    // 🔍 ADD THIS LOG HERE:
    console.log("Database payload before saving:", newFile);

    await newFile.save();

    // 4. Return the upload URL and the MongoDB document data back to the client
    res.status(201).json({
      uploadUrl,
      fileId: newFile._id,
      s3Key: newFile.s3Key,
      expiresAt: newFile.expiresAt
    });

  } catch (error) {
    console.error('❌ Error handling upload metadata:', error);
    res.status(500).json({ error: 'Internal server error setting up upload.' });
  }
});

/**
 * @route   GET /api/files/metadata/:id
 * @desc    Get file info for UI WITHOUT consuming a download
 * @access  Public
 */
router.get('/metadata/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    if (file.isExpired) {
      return res.status(410).json({ 
        error: 'This link has expired or reached its maximum download limit.' 
      });
    }

    res.status(200).json({
      originalName: file.originalName,
      remainingDownloads: file.downloadLimit > 0 ? (file.downloadLimit - file.downloadCount) : 'unlimited'
    });
  } catch (error) {
    console.error('❌ Error fetching metadata:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'File not found.' });
    }
    res.status(500).json({ error: 'Internal server error fetching metadata.' });
  }
});

/**
 * @route   GET /api/files/download/:id
 * @desc    Generate S3 link AND consume 1 download count
 * @access  Public
 */
router.get('/download/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    if (file.isExpired) {
      return res.status(410).json({ 
        error: 'This link has expired or reached its maximum download limit.' 
      });
    }

    // 1. Generate the download link FIRST
    const downloadUrl = await generateDownloadUrl(file.s3Key, file.originalName);

    // 2. Increment count ONLY when the user actually requests the file download
    file.downloadCount += 1;
    await file.save();

    res.status(200).json({ downloadUrl });

  } catch (error) {
    console.error('❌ Error processing file download:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'File not found.' });
    }
    res.status(500).json({ error: 'Internal server error processing download.' });
  }
});

module.exports = router;