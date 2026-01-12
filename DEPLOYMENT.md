# 🚀 Deployment Guide

This guide will help you deploy the Resume Shortlister application to Render (backend) and Vercel (frontend).

## 📋 Prerequisites

1. **GitHub Account** - To host your code
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)

## Part 1: Push to GitHub

### Step 1: Initialize Git Repository

Open a terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit: Resume Shortlister application"
```

### Step 2: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click the **"+"** icon → **"New repository"**
3. Name it: `resume-shortlister`
4. **Don't** initialize with README (we already have one)
5. Click **"Create repository"**

### Step 3: Push to GitHub

Copy the commands from GitHub and run them:

```bash
git remote add origin https://github.com/YOUR_USERNAME/resume-shortlister.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Part 2: Deploy Backend to Render

### Step 1: Create New Web Service

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select `resume-shortlister`

### Step 2: Configure Service

Fill in the following details:

- **Name**: `resume-shortlister-backend`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Free

### Step 3: Add Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (we'll update this later) |

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. Copy your backend URL (e.g., `https://resume-shortlister-backend.onrender.com`)

**Important**: Save this URL - you'll need it for the frontend!

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your `resume-shortlister` repository
4. Click **"Import"**

### Step 2: Configure Project

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Add Environment Variable

Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://your-backend-url.onrender.com/api` |

Replace with your actual Render backend URL from Part 2, Step 4.

**Example**: If your Render URL is `https://resume-shortlister-backend.onrender.com`, enter:
```
https://resume-shortlister-backend.onrender.com/api
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Your app will be live at `https://your-app.vercel.app`

---

## Part 4: Update Backend CORS

Now that you have your Vercel URL, update the backend:

### Step 1: Update Render Environment Variable

1. Go back to Render dashboard
2. Select your backend service
3. Go to **"Environment"**
4. Update `FRONTEND_URL` to your Vercel URL:
   ```
   https://your-app.vercel.app
   ```
5. Click **"Save Changes"**
6. Service will automatically redeploy

---

## ✅ Verification

### Test Your Deployed App

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try uploading a resume file
3. Check if parsing works
4. Test Excel export
5. Test PDF generation

### Troubleshooting

**If uploads don't work:**
- Check browser console for errors
- Verify `VITE_API_URL` in Vercel matches your Render URL
- Check Render logs for errors

**If CORS errors appear:**
- Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
- Make sure both URLs use `https://`

**If backend is slow:**
- Render free tier spins down after inactivity
- First request may take 30-60 seconds to wake up
- Consider upgrading to paid tier for always-on service

---

## 📝 Important Notes

### Render Free Tier Limitations

- **Spins down after 15 minutes** of inactivity
- **750 hours/month** free (enough for one service)
- First request after spin-down takes 30-60 seconds
- **No persistent storage** - uploaded files are temporary

### Vercel Free Tier Limitations

- **100 GB bandwidth/month**
- **Unlimited deployments**
- **Automatic HTTPS**
- **Global CDN**

### File Storage Consideration

⚠️ **Important**: Render's free tier doesn't have persistent storage. Uploaded resumes and generated files will be lost when the service restarts.

**Solutions**:
1. **Use cloud storage** (AWS S3, Cloudinary) for production
2. **Upgrade to paid Render tier** with persistent disks
3. **Accept temporary storage** for demo/testing purposes

---

## 🔄 Updating Your Deployment

### After Making Code Changes

```bash
# Commit your changes
git add .
git commit -m "Description of changes"
git push origin main
```

Both Render and Vercel will **automatically redeploy** when you push to GitHub!

---

## 🌐 Your Live URLs

After deployment, save these URLs:

- **Frontend (Vercel)**: `https://your-app.vercel.app`
- **Backend (Render)**: `https://resume-shortlister-backend.onrender.com`

---

## 🎉 You're Done!

Your Resume Shortlister is now live and accessible from anywhere!

### Share Your App

Send the Vercel URL to anyone who needs to use the application.

### Monitor Your App

- **Vercel Dashboard**: View deployment logs and analytics
- **Render Dashboard**: Monitor backend performance and logs

---

## 💡 Pro Tips

1. **Custom Domain**: Both Vercel and Render support custom domains
2. **Environment Secrets**: Never commit `.env` files to Git
3. **Monitoring**: Set up uptime monitoring (e.g., UptimeRobot)
4. **Backups**: Regularly export important data
5. **Logs**: Check Render logs if something breaks

---

## 🆘 Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **GitHub Issues**: Create an issue in your repository

---

**Happy Deploying! 🚀**
