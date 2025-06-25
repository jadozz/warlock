#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Slack Warlock Bot...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...');
  try {
    const templateContent = fs.readFileSync('example.env', 'utf8');
    fs.writeFileSync('.env', templateContent);
    console.log('✅ .env file created! Please fill in your API keys and tokens.\n');
  } catch (error) {
    console.log('❌ Error creating .env file:', error.message);
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Check for Google credentials
if (!fs.existsSync('credentials.json')) {
  console.log('📋 Google Service Account Setup:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create a new project or select existing');
  console.log('3. Enable Google Sheets API');
  console.log('4. Create a Service Account');
  console.log('5. Download the JSON key file');
  console.log('6. Rename it to "credentials.json" and place in project root');
  console.log('7. Share your Google Sheets with the service account email\n');
} else {
  console.log('✅ Google credentials file found.\n');
}

console.log('🔧 Next steps:');
console.log('1. Fill in your .env file with actual values');
console.log('2. Run: npm install');
console.log('3. Run: npm run dev');
console.log('\n📚 Check README.md for detailed setup instructions');
console.log('\n�� Happy coding!'); 