# Spyfall Game Deployment Guide

This guide will help you deploy the Spyfall game to Railway (backend) and Vercel (frontend).

## Prerequisites

- GitHub account
- Railway account (free tier available)
- Vercel account (free tier available)
- Node.js installed locally

## Backend Deployment (Railway)

### Step 1: Deploy to Railway

1. Go to [Railway.app](https://railway.app) and sign in with your GitHub account
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `spyfall-game-implementation` repository
4. Railway will automatically detect it's a Node.js project
5. Wait for the deployment to complete

### Step 2: Get Railway URL

1. Once deployed, go to your project dashboard
2. Click on the deployed service
3. Copy the generated URL (e.g., `https://your-app-name.railway.app`)

### Step 3: Update Frontend Configuration

1. Update the `frontend/config.js` file with your Railway URL:
```javascript
const config = {
    backendUrl: 'https://your-app-name.railway.app'
};
```

## Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: Leave empty (static files)
   - **Output Directory**: Leave empty
5. Click "Deploy"

### Step 2: Update Backend CORS

1. After Vercel deployment, copy your Vercel URL
2. Update the CORS configuration in `server.js`:
```javascript
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://your-vercel-app.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

### Step 3: Redeploy Backend

1. Commit and push your changes to GitHub
2. Railway will automatically redeploy with the updated CORS settings

## Environment Variables

### Railway Environment Variables

You can set these in your Railway project dashboard:

- `PORT`: Railway sets this automatically
- `NODE_ENV`: `production`

### Vercel Environment Variables

You can set these in your Vercel project dashboard:

- `RAILWAY_URL`: Your Railway backend URL

## Testing the Deployment

1. Open your Vercel frontend URL
2. Create a new room
3. Share the room code with others
4. Test the multiplayer functionality

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the frontend URL is added to the backend CORS configuration
2. **Socket Connection Failed**: Check that the backend URL in `config.js` is correct
3. **Build Failures**: Ensure all dependencies are in `package.json`

### Health Check

You can test if your backend is running by visiting:
`https://your-railway-app.railway.app/health`

## Support

If you encounter issues:
1. Check the Railway logs in your project dashboard
2. Check the Vercel logs in your project dashboard
3. Ensure all URLs are correctly configured
