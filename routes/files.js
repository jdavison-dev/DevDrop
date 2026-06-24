const express = require('express');
const router = express.Router();
const { generateUploadUrl } = require('../config/s3');
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

module.exports = router;