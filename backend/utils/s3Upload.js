const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');

// Initialize S3 Client
// The AWS SDK automatically picks up AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION from process.env
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Uploads a file buffer to S3
 * @param {Object} file - The file object from multer (needs originalname, fieldname, buffer, mimetype)
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadToS3 = async (file) => {
  const ext = path.extname(file.originalname);
  const randomString = crypto.randomBytes(4).toString('hex');
  const filename = `${file.fieldname}-${Date.now()}-${randomString}${ext}`;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);
  
  return `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filename}`;
};

/**
 * Deletes a file from S3 given its public URL
 * @param {string} fileUrl - The public URL of the file
 */
const deleteFromS3 = async (fileUrl) => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) return;

    // Extract the object key from the URL
    // URL format: https://bucket-name.s3.region.amazonaws.com/filename.ext
    const urlParts = fileUrl.split('/');
    const key = urlParts[urlParts.length - 1];

    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3.send(command);
  } catch (err) {
    console.error('Error deleting from S3:', err);
  }
};

module.exports = { uploadToS3, deleteFromS3 };
