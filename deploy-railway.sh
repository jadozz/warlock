#!/bin/bash

echo "🚂 Slack Warlock Railway Deployment Script"
echo "=========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway:"
    railway login
fi

# Initialize project
echo "🚀 Initializing Railway project..."
railway init

# Set environment variables
echo "🔧 Setting environment variables..."
echo "Please enter your environment variables:"

read -p "SLACK_BOT_TOKEN (xoxb-...): " SLACK_BOT_TOKEN
read -p "SLACK_SIGNING_SECRET: " SLACK_SIGNING_SECRET
read -p "SLACK_APP_TOKEN (xapp-...): " SLACK_APP_TOKEN
read -p "OPENAI_API_KEY (sk-...): " OPENAI_API_KEY
read -p "GOOGLE_SHEETS_SPREADSHEET_ID: " GOOGLE_SHEETS_SPREADSHEET_ID
read -p "GOOGLE_SERVICE_ACCOUNT_EMAIL: " GOOGLE_SERVICE_ACCOUNT_EMAIL
echo "GOOGLE_PRIVATE_KEY (paste the entire private key, press Enter twice when done):"
GOOGLE_PRIVATE_KEY=""
while IFS= read -r line; do
    [ -z "$line" ] && break
    GOOGLE_PRIVATE_KEY="$GOOGLE_PRIVATE_KEY$line\n"
done

# Set all environment variables
railway variables set SLACK_BOT_TOKEN="$SLACK_BOT_TOKEN"
railway variables set SLACK_SIGNING_SECRET="$SLACK_SIGNING_SECRET"
railway variables set SLACK_APP_TOKEN="$SLACK_APP_TOKEN"
railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
railway variables set GOOGLE_SHEETS_SPREADSHEET_ID="$GOOGLE_SHEETS_SPREADSHEET_ID"
railway variables set GOOGLE_SERVICE_ACCOUNT_EMAIL="$GOOGLE_SERVICE_ACCOUNT_EMAIL"
railway variables set GOOGLE_PRIVATE_KEY="$GOOGLE_PRIVATE_KEY"

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🎉 Your Slack bot should now be running on Railway!"
echo "📋 To view logs: railway logs"
echo "🔧 To manage: railway open" 