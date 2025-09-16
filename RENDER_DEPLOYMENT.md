# 🚀 Render Backend Deployment Guide

Your backend is having issues on Render. Here's how to fix it:

## 1. Check Render Dashboard

Go to: https://dashboard.render.com

Look for your service: **seizure-monitor** (or whatever you named it)

## 2. Required Environment Variables

In your Render service settings, go to **Environment** tab and add:

```
JWT_SECRET=your-secure-random-string-here-change-this
FRONTEND_URL=https://seizure-monitor.netlify.app
```

## 3. Check the Logs

In Render dashboard, click on **Logs** to see what's failing. Common issues:

- Missing environment variables
- Port binding issues
- Build failures

## 4. Service Settings

Make sure your service has:

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `backend`

## 5. Redeploy

After fixing any issues:
1. Click **Manual Deploy** → **Deploy latest commit**
2. Wait for the build to complete
3. Check the logs for "Server running on port"

## 6. Test the Backend

Once deployed, test it:
```bash
curl https://seizure-monitor.onrender.com/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

## 7. Common Fixes

### If build fails:
- Check that `backend/package.json` has all dependencies
- Make sure `build` script exists (we added it)

### If server doesn't start:
- Check JWT_SECRET is set in environment variables
- Verify the start command is `npm start`

### If 502 errors persist:
- The server might be crashing on startup
- Check logs for error messages
- Make sure SQLite can write to disk

## 8. Alternative: Use Mock API

If backend won't deploy, you can use the mock API:

Edit `src/services/api.ts`:
```typescript
const USE_MOCK = true; // Enable mock API
```

This will let the app work without a backend.

## Need Help?

1. Check Render logs for specific errors
2. Make sure GitHub repo is connected
3. Verify all environment variables are set
4. Try redeploying from Render dashboard

The app will work with mock data until the backend is fixed!