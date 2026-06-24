const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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

module.exports = { s3Client, generateUploadUrl };