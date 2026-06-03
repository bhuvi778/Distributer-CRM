# Distributor CRM — DistriFlow

A full-stack Sales & Distribution Management System built with React + Node.js + MongoDB.

## 🚀 Live Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | *(set after deploy)* |
| Backend  | Render  | *(set after deploy)* |
| Database | MongoDB Atlas | Cloud |

---

## 📦 Local Development

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Setup
```bash
# Clone the repo
git clone https://github.com/bhuvi778/Distributer-CRM.git
cd Distributer-CRM

# Install all dependencies
npm run install-all

# Create server/.env (copy from example)
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret

# Run both frontend + backend
npm run dev
```

### Default Login (after seeding)
```bash
npm run seed
```

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@distriFlow.com | super123 |
| Admin | admin@distriFlow.com | admin123 |
| Sales Exec | amit@distriFlow.com | exec123 |
| Retailer | retailer1@distriflow.com | retailer123 |

---

## ☁️ Deployment Guide

### Step 1 — MongoDB Atlas (Free Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free account → Create free cluster (M0)
3. Database Access → Add user with password
4. Network Access → Allow all IPs: `0.0.0.0/0`
5. Connect → Drivers → Copy connection string
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/distri_flow
   ```

---

### Step 2 — Backend on Render

1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect GitHub → Select `Distributer-CRM` repo
3. Settings:
   - **Name:** `distriflow-api`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Environment Variables → Add these:
   ```
   MONGO_URI = mongodb+srv://...  (from Atlas)
   JWT_SECRET = any_long_random_string_min_32_chars
   JWT_EXPIRE = 7d
   NODE_ENV = production
   FRONTEND_URL = https://your-app.vercel.app
   ```
5. Click **Deploy** → Wait ~2 mins
6. Copy your Render URL: `https://distriflow-api.onrender.com`

---

### Step 3 — Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import `Distributer-CRM` from GitHub
3. Settings:
   - **Framework:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Environment Variables → Add:
   ```
   VITE_API_URL = https://distriflow-api.onrender.com
   ```
   *(Use your actual Render URL from Step 2)*
5. Click **Deploy** → Done!

### Step 4 — Update CORS on Render

After Vercel deploy, go back to Render → Environment Variables → Update:
```
FRONTEND_URL = https://your-actual-vercel-url.vercel.app
```
Then Redeploy.

---

## 🏗️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Auth:** JWT tokens
- **Deployment:** Vercel (frontend) + Render (backend) + MongoDB Atlas
