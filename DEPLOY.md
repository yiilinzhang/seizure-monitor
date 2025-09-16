# 📱 Deploy Your Seizure Monitor App

## Quick Deployment Steps:

### 1. Frontend (Netlify) - FREE & EASY
1. Go to: https://app.netlify.com/drop
2. Drag and drop the `dist` folder (already built)
3. Your app will be live in seconds!
4. Save the URL (e.g., `amazing-site-123.netlify.app`)

### 2. Backend (Render) - FREE
1. Go to: https://render.com
2. Sign up/login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub (or use "Deploy from Git URL")
5. Settings:
   - Name: `seizure-monitor-backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables:
     ```
     JWT_SECRET=your-secret-key-here-change-this
     TWILIO_ACCOUNT_SID=your-twilio-sid
     TWILIO_AUTH_TOKEN=your-twilio-token
     TWILIO_PHONE_NUMBER=your-twilio-phone
     FRONTEND_URL=https://your-netlify-url.netlify.app
     PORT=3001
     ```
6. Click "Create Web Service"
7. Save the URL (e.g., `https://seizure-monitor-backend.onrender.com`)

### 3. Update Frontend with Backend URL
1. Edit `.env.production`:
   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com/api
   ```
2. Run: `npm run build`
3. Re-upload `dist` folder to Netlify

### 4. Access on Phone
1. Visit your Netlify URL on phone
2. Add to Home Screen
3. Done! 🎉

## Local Testing (Current Setup)
- Frontend: http://172.31.98.190:5173
- Backend: http://172.31.98.190:3001

## Notes
- Render free tier sleeps after 15 min inactivity (first request will be slow)
- Twilio trial allows ~150 SMS or ~75 minutes of calls
- All data stored in SQLite database