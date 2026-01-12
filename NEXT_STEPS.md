# 🎯 Next Steps - Quick Reference

Your code is ready and committed to Git! Here's what to do next:

## 1️⃣ Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `resume-shortlister`
3. Description: "Intelligent Resume Parser & Masked Resume Generator"
4. **Keep it Public** (or Private if you prefer)
5. **DO NOT** check "Initialize with README"
6. Click **"Create repository"**

## 2️⃣ Push Your Code

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
git remote add origin https://github.com/YOUR_USERNAME/resume-shortlister.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

Example:
```bash
git remote add origin https://github.com/johndoe/resume-shortlister.git
git branch -M main
git push -u origin main
```

## 3️⃣ Deploy Backend to Render

### Quick Steps:
1. Go to: https://render.com
2. Sign up/Login (use GitHub to connect)
3. Click **"New +"** → **"Web Service"**
4. Connect your `resume-shortlister` repository
5. Configure:
   - **Name**: `resume-shortlister-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `*` (we'll update this later)
7. Click **"Create Web Service"**
8. **SAVE YOUR BACKEND URL!** (e.g., `https://resume-shortlister-backend.onrender.com`)

## 4️⃣ Deploy Frontend to Vercel

### Quick Steps:
1. Go to: https://vercel.com
2. Sign up/Login (use GitHub)
3. Click **"Add New..."** → **"Project"**
4. Import `resume-shortlister`
5. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://YOUR-BACKEND-URL.onrender.com/api`
   
   Example: `https://resume-shortlister-backend.onrender.com/api`
7. Click **"Deploy"**
8. **SAVE YOUR FRONTEND URL!** (e.g., `https://resume-shortlister.vercel.app`)

## 5️⃣ Update Backend CORS

1. Go back to Render dashboard
2. Select your backend service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL` to your Vercel URL:
   ```
   https://resume-shortlister.vercel.app
   ```
5. Click **"Save Changes"**

## ✅ Test Your Live App!

Visit your Vercel URL and test:
- ✅ Upload resumes
- ✅ Parse data
- ✅ Export to Excel
- ✅ Generate PDFs

---

## 📋 Checklist

- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Deployed backend to Render
- [ ] Saved backend URL
- [ ] Deployed frontend to Vercel
- [ ] Saved frontend URL
- [ ] Updated FRONTEND_URL in Render
- [ ] Tested live application

---

## 🔗 Important URLs

**GitHub Repository**: `https://github.com/YOUR_USERNAME/resume-shortlister`

**Backend (Render)**: `https://_____.onrender.com`

**Frontend (Vercel)**: `https://_____.vercel.app`

---

## 💡 Tips

- **First load may be slow** - Render free tier spins down after inactivity
- **Automatic deployments** - Push to GitHub to update both services
- **Check logs** - Use Render and Vercel dashboards to debug issues
- **Environment variables** - Never commit `.env` files to Git

---

## 🆘 Troubleshooting

**Can't push to GitHub?**
```bash
# Check if remote is set
git remote -v

# If not set, add it
git remote add origin https://github.com/YOUR_USERNAME/resume-shortlister.git
```

**CORS errors?**
- Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly
- Include `https://` in the URL

**Backend not responding?**
- Check Render logs for errors
- Verify build completed successfully
- Wait 30-60 seconds for service to wake up (free tier)

---

## 📚 Full Documentation

For detailed instructions, see: **DEPLOYMENT.md**

---

**You're almost there! 🚀**
