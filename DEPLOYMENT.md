# Slack Warlock Deployment Guide

## 🆓 Best Free Tier Options (Most Generous First)

### Option 1: Railway (Most Generous - $5/month credits)
**Why Railway:**
- ✅ **$5/month in free credits** (runs 24/7 for months)
- ✅ 500 execution hours/month
- ✅ 1GB RAM, 1 vCPU
- ✅ No credit card required
- ✅ Automatic Git deployments
- ✅ Built-in logging and monitoring

```bash
./deploy-railway.sh
```

### Option 2: Render (750 hours/month free)
**Why Render:**
- ✅ 750 hours/month free tier
- ✅ Automatic HTTPS
- ✅ GitHub integration
- ✅ Easy environment variables
- ⚠️ Sleeps after 15 minutes (wakes on requests)

**Deploy to Render:**
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Connect GitHub repo
4. Set environment variables
5. Deploy!

### Option 3: Fly.io (No sleep, global)
**Why Fly.io:**
- ✅ 3 VMs with 256MB RAM free
- ✅ 160GB/month bandwidth
- ✅ No sleep limitations
- ✅ Global deployment
- ✅ Docker-based

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login and deploy
fly auth login
fly launch
```

### Option 4: Cyclic (Completely free)
**Why Cyclic:**
- ✅ **Completely free forever**
- ✅ No credit card required
- ✅ GitHub integration
- ✅ Perfect for bots
- ✅ No sleep limitations

**Deploy to Cyclic:**
1. Push to GitHub
2. Go to [cyclic.sh](https://cyclic.sh)
3. Connect repo
4. Set environment variables
5. Deploy!

---

## 💳 Paid Options (When You Outgrow Free)

### Option 5: Heroku (Classic choice)

### Prerequisites
1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Create a [Heroku account](https://signup.heroku.com/)

### Steps
1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-slack-warlock-bot
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set SLACK_BOT_TOKEN=xoxb-your-token
   heroku config:set SLACK_SIGNING_SECRET=your-signing-secret
   heroku config:set SLACK_APP_TOKEN=xapp-your-app-token
   heroku config:set OPENAI_API_KEY=sk-your-openai-key
   heroku config:set GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
   heroku config:set GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   heroku config:set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

5. **Scale the App**
   ```bash
   heroku ps:scale web=1
   ```

6. **View Logs**
   ```bash
   heroku logs --tail
   ```

---

### Option 6: DigitalOcean App Platform

1. Push code to GitHub repository
2. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
3. Create new app from GitHub repo
4. Set environment variables in the app settings
5. Deploy

---

### Option 7: Google Cloud Run

### Prerequisites
1. Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. Create a Google Cloud project

### Steps
1. **Build and Deploy**
   ```bash
   gcloud run deploy slack-warlock \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "SLACK_BOT_TOKEN=xoxb-your-token,SLACK_SIGNING_SECRET=your-signing-secret,SLACK_APP_TOKEN=xapp-your-app-token,OPENAI_API_KEY=sk-your-openai-key,GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id,GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com,GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
   ```

---

## 🎯 Recommendation

**For maximum free usage:** Start with **Railway** - their $5/month in free credits will run your bot 24/7 for several months without any cost.

**For long-term free:** Use **Cyclic** - completely free forever with no limitations.

**For enterprise:** Use **Heroku** or **Google Cloud Run** for production workloads.

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token | `xoxb-123-456-abc` |
| `SLACK_SIGNING_SECRET` | Slack App Signing Secret | `abc123def456` |
| `SLACK_APP_TOKEN` | App-Level Token for Socket Mode | `xapp-1-A123-456-def` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-abc123def456` |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Google Sheets ID | `1ymXnk1mXFP1Bad0QUjus9qmFPR-Ll-ilLIUkFijnNWU` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service Account Email | `service@project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Service Account Private Key | `-----BEGIN PRIVATE KEY-----\n...` |

---

## Troubleshooting

### Common Issues
1. **App crashes on startup**: Check logs for missing environment variables
2. **Google Sheets access denied**: Verify service account has access to the sheet
3. **Slack connection issues**: Ensure app tokens are correct and Socket Mode is enabled

### Viewing Logs
- **Railway**: `railway logs`
- **Render**: Check dashboard logs
- **Fly.io**: `fly logs`
- **Cyclic**: Check dashboard logs
- **Heroku**: `heroku logs --tail`
- **DigitalOcean**: Check app logs in dashboard
- **Google Cloud**: `gcloud run logs read --service slack-warlock`

### Health Check
Once deployed, the app should show:
```
⚡️ Slack Warlock bot is running!
📊 Google Sheets connection established!
[INFO] Now connected to Slack
``` 