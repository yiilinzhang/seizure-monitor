# 🚀 Push to GitHub - Quick Steps

Your code is ready to push! Just follow these steps:

## 1. Create GitHub Repository

### Go to GitHub:
1. Visit: https://github.com/new
2. Repository name: `seizure-monitor`
3. Description: "Seizure monitoring app with ESP32 sensor integration"
4. Choose: **Public** (required for free Render deployment)
5. DON'T initialize with README (we already have code)
6. Click **"Create repository"**

## 2. Copy the Commands

After creating, GitHub will show you commands. Use these:

```bash
cd /Users/yilinzhang/Downloads/Sensor\ code\ Pixel

# Add your GitHub repo as origin (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/seizure-monitor.git

# Push the code
git branch -M main
git push -u origin main
```

## 3. Enter Your GitHub Credentials

When prompted:
- Username: Your GitHub username
- Password: Your GitHub **Personal Access Token** (not password!)

### To create a token:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name like "seizure-monitor"
4. Select scopes: `repo` (full control)
5. Generate and copy the token
6. Use this token as your password

## 4. Verify Upload

Visit: `https://github.com/YOUR_USERNAME/seizure-monitor`

You should see all your code!

## 5. Deploy to Render

Now you can:
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub
4. Select the `seizure-monitor` repo
5. Deploy!

---

## Quick Alternative: Use GitHub Desktop

If terminal is confusing:
1. Download GitHub Desktop: https://desktop.github.com
2. Sign in
3. Add existing repository → Choose your folder
4. Publish repository
5. Done!