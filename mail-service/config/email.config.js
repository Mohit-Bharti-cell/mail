const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create email transporter
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  // For Gmail, use service instead of host/port
  if (process.env.EMAIL_SERVICE === 'gmail') {
    config.service = 'gmail';
    delete config.host;
    delete config.port;
  }

  // ✅ FIXED LINE:
  const transporter = nodemailer.createTransport(config);

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      logger.error('Email transporter verification failed:', error);
    } else {
      logger.info('Email transporter is ready to send messages');
    }
  });

  return transporter;
};

module.exports = {
  createTransporter
};
