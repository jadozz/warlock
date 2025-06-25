const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.auth = null;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_ID;
    console.log('🔍 GoogleSheetsService constructor:');
    console.log('   GOOGLE_SHEETS_SPREADSHEET_ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
    console.log('   GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID);
    console.log('   Final spreadsheetId:', this.spreadsheetId);
  }

  async initialize() {
    try {
      console.log('🔍 Initializing Google Sheets authentication...');
      console.log('   Has GOOGLE_SERVICE_ACCOUNT_EMAIL:', !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
      console.log('   Has GOOGLE_PRIVATE_KEY:', !!process.env.GOOGLE_PRIVATE_KEY);
      console.log('   Has GOOGLE_CREDENTIALS_FILE:', !!process.env.GOOGLE_CREDENTIALS_FILE);
      
      // Debug: Show the first 50 characters of GOOGLE_CREDENTIALS_FILE to identify the issue
      if (process.env.GOOGLE_CREDENTIALS_FILE) {
        const credFile = process.env.GOOGLE_CREDENTIALS_FILE;
        console.log('   GOOGLE_CREDENTIALS_FILE preview:', credFile.substring(0, 50) + '...');
        console.log('   GOOGLE_CREDENTIALS_FILE type:', typeof credFile);
        console.log('   GOOGLE_CREDENTIALS_FILE starts with {:', credFile.trim().startsWith('{'));
      }
      
      // Set up authentication using environment variables (better for production)
      if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        // Use service account from environment variables
        this.auth = new google.auth.JWT(
          process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          null,
          process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          ['https://www.googleapis.com/auth/spreadsheets.readonly']
        );
        console.log('🔐 Using environment variable authentication');
      } else if (process.env.GOOGLE_CREDENTIALS_FILE) {
        // Check if GOOGLE_CREDENTIALS_FILE contains JSON content instead of a file path
        const credentialsPath = process.env.GOOGLE_CREDENTIALS_FILE;
        
        if (credentialsPath.trim().startsWith('{')) {
          // This is JSON content, not a file path - parse it directly
          console.log('🔐 GOOGLE_CREDENTIALS_FILE contains JSON content, parsing directly...');
          try {
            const credentials = JSON.parse(credentialsPath);
            this.auth = new google.auth.JWT(
              credentials.client_email,
              null,
              credentials.private_key,
              ['https://www.googleapis.com/auth/spreadsheets.readonly']
            );
            console.log('✅ Successfully parsed credentials from environment variable JSON');
          } catch (parseError) {
            console.error('❌ Failed to parse credentials JSON:', parseError.message);
            throw new Error('Invalid JSON in GOOGLE_CREDENTIALS_FILE environment variable');
          }
        } else {
          // This is a file path
          console.log('🔐 Using explicit credentials file:', credentialsPath);
          this.auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
          });
        }
      } else {
        // Fallback to default credentials file location
        const defaultPath = path.join(__dirname, '../../credentials.json');
        console.log('🔐 Using default credentials file:', defaultPath);
        this.auth = new google.auth.GoogleAuth({
          keyFile: defaultPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      }

      // Create sheets instance
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      console.log('✅ Google Sheets service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Sheets service:', error);
      throw error;
    }
  }

  async getSheetData(range = 'Raw Data!A:CP') {
    try {
      console.log('🔍 Attempting to fetch range:', range);
      console.log('📋 Using spreadsheet ID:', this.spreadsheetId);
      
      // Safety check: ensure spreadsheetId is available
      if (!this.spreadsheetId) {
        console.error('❌ No spreadsheet ID available! Checking environment variables again...');
        console.log('   GOOGLE_SHEETS_SPREADSHEET_ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
        console.log('   GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID);
        
        // Try to recover the spreadsheet ID
        this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_ID;
        console.log('   Recovered spreadsheetId:', this.spreadsheetId);
        
        if (!this.spreadsheetId) {
          throw new Error('Missing spreadsheet ID. Please set GOOGLE_SHEETS_SPREADSHEET_ID or GOOGLE_SHEETS_ID environment variable.');
        }
      }
      
      if (!this.sheets) {
        await this.initialize();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      const rows = response.data.values;
      console.log('📊 Raw data rows count:', rows ? rows.length : 0);
      
      if (!rows || rows.length === 0) {
        console.log('No data found in sheet');
        return [];
      }

      // Convert to objects using first row as headers
      const headers = rows[0];
      console.log('📋 Headers found:', headers.slice(0, 5), '... (showing first 5)');
      
      const data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
        });
        return obj;
      });

      console.log('📈 Processed data count:', data.length);
      if (data.length > 0) {
        console.log('🔍 Sample row keys:', Object.keys(data[0]).slice(0, 10));
        console.log('🔍 Sample property value:', data[0].property);
      }

      return data;
    } catch (error) {
      console.error('Error fetching sheet data:', error.message);
      console.error('Full error:', error);
      throw error;
    }
  }

  async getStartupData() {
    try {
      console.log('Fetching startup data from Google Sheets...');
      // Using 'Raw Data' sheet as specified
      const data = await this.getSheetData('Raw Data!A:CP');
      console.log('📊 Raw startup data before filtering:', data.length);
      
      // Filter out empty rows - using 'property' as the name field
      const filtered = data.filter(row => {
        // Primary field is 'property' (column A)
        const hasProperty = row.property && row.property.trim() !== '';
        return hasProperty;
      });
      
      console.log('✅ Filtered startup data:', filtered.length);
      if (filtered.length > 0) {
        console.log('📋 Sample filtered startup:', filtered[0].property);
      }
      return filtered;
    } catch (error) {
      console.error('Error fetching startup data:', error);
      return [];
    }
  }

  async searchSheet(query, range = 'Raw Data!A:CP') {
    try {
      console.log('🔍 SearchSheet called with range:', range);
      const data = await this.getSheetData(range);
      const lowerQuery = query.toLowerCase();
      
      console.log('🔍 SearchSheet: searching through', data.length, 'rows for:', query);
      
      const results = data.filter(row => {
        // Search across all fields
        return Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(lowerQuery)
        );
      });
      
      console.log('🔍 SearchSheet: found', results.length, 'results');
      return results;
    } catch (error) {
      console.error('Error searching sheet:', error);
      return [];
    }
  }
}

module.exports = { GoogleSheetsService }; 