const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

// Initialize the S3 client with secure credentials from the env file
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generates a temporary, secure URL allowing a client to upload a file directly to S3
 * @param {string} originalName - The actual name of the file being uploaded
 * @returns {Promise<{ uploadUrl: string, s3Key: string }>}
 */
const generateUploadUrl = async (originalName) => {
  // Create a completely unique filename using a UUID to prevent files overwriting each other
  const uniqueId = uuidv4();
  const s3Key = `${uniqueId}-${originalName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
    // Can be adjusted for file types and such, for now all are allowed
  });

  // Generate a presigned URL that expires in 15 minutes (900 seconds)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return { uploadUrl, s3Key };
};

/**
 * Generates a temporary, secure URL allowing a client to DOWNLOAD a file from S3
 * @param {string} s3Key - The unique key of the file in the S3 bucket
 * @returns {Promise<string>} - The signed download URL expiring in 5 minutes
 */
const generateDownloadUrl = async (s3Key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
  });

  // Expire the link itself in 5 minutes (300 seconds) for tight security
  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return downloadUrl;
};

module.exports = { s3Client, generateUploadUrl, generateDownloadUrl };