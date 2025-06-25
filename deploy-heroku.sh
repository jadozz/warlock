#!/bin/bash

echo "🚀 Slack Warlock Heroku Deployment Script"
echo "=========================================="

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please login to Heroku first:"
    heroku login
fi

# Create app name
read -p "Enter your Heroku app name (e.g., my-slack-warlock): " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo "❌ App name is required"
    exit 1
fi

echo "📱 Creating Heroku app: $APP_NAME"
heroku create $APP_NAME

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
heroku config:set SLACK_BOT_TOKEN="$SLACK_BOT_TOKEN" -a $APP_NAME
heroku config:set SLACK_SIGNING_SECRET="$SLACK_SIGNING_SECRET" -a $APP_NAME
heroku config:set SLACK_APP_TOKEN="$SLACK_APP_TOKEN" -a $APP_NAME
heroku config:set OPENAI_API_KEY="$OPENAI_API_KEY" -a $APP_NAME
heroku config:set GOOGLE_SHEETS_SPREADSHEET_ID="$GOOGLE_SHEETS_SPREADSHEET_ID" -a $APP_NAME
heroku config:set GOOGLE_SERVICE_ACCOUNT_EMAIL="$GOOGLE_SERVICE_ACCOUNT_EMAIL" -a $APP_NAME
heroku config:set GOOGLE_PRIVATE_KEY="$GOOGLE_PRIVATE_KEY" -a $APP_NAME

# Deploy
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy Slack Warlock to Heroku"
git push heroku main

# Scale the app
echo "📊 Scaling the app..."
heroku ps:scale web=1 -a $APP_NAME

# Show status
echo "✅ Deployment complete!"
echo "📱 App URL: https://$APP_NAME.herokuapp.com"
echo "📋 To view logs: heroku logs --tail -a $APP_NAME"
echo "🔧 To manage app: heroku open -a $APP_NAME"

echo ""
echo "🎉 Your Slack bot should now be running in production!"
echo "Test it by messaging your bot in Slack." 