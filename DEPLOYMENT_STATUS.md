# 🚀 Vercel Deployment Status

## Live URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://frontend-zeta-neon-16.vercel.app | ✅ Live (HTTP 200) |
| **Backend API** | https://backend-bice-seven-71.vercel.app | ✅ Live (healthy) |
| **API Health** | https://backend-bice-seven-71.vercel.app/health | ✅ Responding |

## Vercel Projects

| Project | Vercel Dashboard |
|---------|-----------------|
| Frontend | https://vercel.com/dalasmart/frontend |
| Backend | https://vercel.com/dalasmart/backend |

## Token Location
- Saved at: `.vercel-token` (gitignored, not committed)
- Removed from: `README.md` (was at bottom, now removed)

## Environment Variables Set on Vercel

### Backend
- `DATABASE_URL` — Neon PostgreSQL connection
- `JWT_SECRET` — Authentication tokens
- `JWT_REFRESH_SECRET` — Token refresh
- `ENCRYPTION_KEY` — OAuth token encryption
- `OPENAI_API_KEY` — AI text generation
- `GOOGLE_GEMINI_API_KEY` — AI text (primary)
- `STABILITY_API_KEY` — Image generation
- `KLING_API_KEY` — Video generation
- `ELEVENLABS_API_KEY` — Voice generation
- `APP_URL` — Frontend URL (for CORS)
- `NODE_ENV` — production

### Frontend
- `VITE_API_URL` — Backend API URL

## Deployment Commands

```bash
# Deploy backend to production
cd backend && vercel deploy --prod --token $(cat ../.vercel-token)

# Deploy frontend to production
cd frontend && vercel deploy --prod --token $(cat ../.vercel-token)

# Deploy backend (preview)
cd backend && vercel deploy --token $(cat ../.vercel-token)

# Deploy frontend (preview)
cd frontend && vercel deploy --token $(cat ../.vercel-token)

# View backend logs
vercel inspect <deployment-url> --logs --token $(cat ../.vercel-token)
```

## ⚠️ OAuth Redirect URIs Need Updating

The OAuth callback URLs in the backend currently point to localhost. You need to update
them in each platform's developer console to use the Vercel backend URL:

| Platform | Current Redirect URI | Needs to be |
|----------|----------------------|-------------|
| TikTok | localhost:5000/api/oauth/tiktok/callback | backend-bice-seven-71.vercel.app/api/oauth/tiktok/callback |
| YouTube | localhost:5000/api/oauth/youtube/callback | backend-bice-seven-71.vercel.app/api/oauth/youtube/callback |
| Instagram | localhost:5000/api/oauth/instagram/callback | backend-bice-seven-71.vercel.app/api/oauth/instagram/callback |
| Facebook | localhost:5000/api/oauth/facebook/callback | backend-bice-seven-71.vercel.app/api/oauth/facebook/callback |
| X/Twitter | localhost:5000/api/oauth/x/callback | backend-bice-seven-71.vercel.app/api/oauth/x/callback |
| LinkedIn | localhost:5000/api/oauth/linkedin/callback | backend-bice-seven-71.vercel.app/api/oauth/linkedin/callback |
| Google Auth | localhost:5000/api/auth/google/callback | backend-bice-seven-71.vercel.app/api/auth/google/callback |

Update these in:
- TikTok Developer Portal
- Google Cloud Console
- Meta Developer App
- X Developer Portal
- LinkedIn Developer App

## ⚠️ Serverless Limitations

The backend runs as a Vercel serverless function. These features won't work in serverless mode:
- **Cron scheduler** — Background jobs (publishing, analytics sync) won't run automatically
- **File uploads** — No persistent filesystem (use cloud storage like S3/Cloudinary instead)
- **Long-running processes** — 10s timeout on Hobby plan

For full functionality (scheduler, file uploads), keep the Docker deployment running on a VPS
and use Vercel for the frontend only, pointing VITE_API_URL to the VPS backend.

## Files Changed
- `README.md` — Removed token from bottom
- `.gitignore` — Added `.vercel-token` and `.vercel/` to ignored files
- `backend/src/server.js` — Vercel serverless compatibility (conditional start)
- `backend/vercel.json` — Vercel config for backend
- `frontend/vercel.json` — Vercel config for frontend with API proxy
- `.vercel-token` — Saved token (gitignored)
- `DEPLOYMENT_STATUS.md` — This file
