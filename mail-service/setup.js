#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Mail Service...\n');

// Create necessary directories
const directories = [
  'config',
  'controllers',
  'services',
  'templates',
  'middleware',
  'utils',
  'logs'
];

console.log('📁 Creating directories...');
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`ℹ️  Directory already exists: ${dir}`);
  }
});

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n⚠️  .env file not found!');
  console.log('📝 Please create a .env file with the following variables:');
  console.log(`
PORT=3001
NODE_ENV=development

EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=HR Team

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

COMPANY_NAME=Your Company Name
COMPANY_WEBSITE=https://yourcompany.com
  `);
} else {
  console.log('\n✅ .env file found');
}

console.log('\n📦 Next steps:');
console.log('1. Update the .env file with your email credentials');
console.log('2. Run: npm install');
console.log('3. Run: npm run dev (for development) or npm start (for production)');
console.log('\n🔧 For Gmail, you\'ll need to:');
console.log('• Enable 2-factor authentication');
console.log('• Generate an "App Password" for this application');
console.log('• Use the App Password in EMAIL_PASS (not your regular password)');

console.log('\n✨ Setup complete!');