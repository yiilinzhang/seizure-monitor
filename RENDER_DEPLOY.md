# 🚀 Deploy Backend to Render - Quick Steps

## 1. Go to Render.com
https://render.com

## 2. Sign up/Login
- Use your GitHub account (easiest)
- Or email signup

## 3. Create New Web Service
Click **"New +"** → **"Web Service"**

## 4. Deploy from GitHub
Option A: **Connect GitHub account** (recommended)
- Authorize Render
- Select your repo

Option B: **Deploy from public Git URL**
- Use: `https://github.com/yourusername/seizure-monitor-backend`
- (You'll need to push the backend folder to GitHub first)

## 5. Configure Service
Fill in these settings:

**Basic Info:**
- Name: `seizure-monitor-backend`
- Region: Choose closest to you
- Branch: `main`
- Root Directory: `backend` (if in monorepo) or leave blank
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

## 6. Add Environment Variables
Click **"Advanced"** then add these:

```
JWT_SECRET = your-super-secret-key-change-this
FRONTEND_URL = https://velvety-starlight-e9ddcd.netlify.app
PORT = 3001

# For Twilio (optional - for SMS/calls):
TWILIO_ACCOUNT_SID = your-twilio-sid
TWILIO_AUTH_TOKEN = your-twilio-token
TWILIO_PHONE_NUMBER = your-twilio-phone
```

## 7. Create Web Service
Click **"Create Web Service"**

Wait 2-3 minutes for deployment...

## 8. Get Your Backend URL
Once deployed, you'll get a URL like:
`https://seizure-monitor-backend.onrender.com`

## 9. Update Frontend
1. Edit `.env.production`:
```
VITE_API_URL=https://seizure-monitor-backend.onrender.com/api
```

2. Rebuild frontend:
```bash
npm run build
```

3. Re-upload `dist` folder to Netlify

## 🎉 Done!
Your app now has a real backend with database and SMS/call capabilities!

## Notes:
- Free tier sleeps after 15 min inactivity (first request will be slow)
- Add credit card for always-on service ($7/month)
- Database persists even on free tier