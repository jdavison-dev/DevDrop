const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
    s3Key: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    downloadLimit: {
        type: Number,
        default: 0,      // 0 means unlimited if no limit set
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Virtual attribute to easily check if a file has expired or hit its limit
FileSchema.virtual('isExpired').get(function() {
  const isTimeExpired = new Date() > this.expiresAt;
  const isLimitReached = this.downloadLimit > 0 && this.downloadCount >= this.downloadLimit;
  return isTimeExpired || isLimitReached;
});

module.exports = mongoose.model('File', FileSchema);