require('dotenv').config();

const config = {
  appName: process.env.APPLICATION_NAME,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
  fileUploadDir: process.env.FILE_UPLOAD_DIR,
  maxFileSize: process.env.MAX_FILE_SIZE
};

module.exports = config;
