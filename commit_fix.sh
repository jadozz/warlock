#!/bin/bash

echo "🔧 Committing Google Sheets authentication fix..."

# Add all changes
git add -A

# Commit with descriptive message
git commit -m "Fix Google Sheets authentication for Render deployment

- Handle case where GOOGLE_CREDENTIALS_FILE contains JSON content instead of file path
- Add comprehensive debugging for environment variable authentication
- Prevents ENAMETOOLONG error when credentials JSON is passed as environment variable
- Supports both file path and direct JSON content in GOOGLE_CREDENTIALS_FILE
- Better error handling and logging for authentication issues"

# Push to remote
git push origin main

echo "✅ Changes committed and pushed!" 