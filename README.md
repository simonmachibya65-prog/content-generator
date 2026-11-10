<div align="center">

# 🚀 Publift - AI Social Media Management Platform

**Lift your publishing game. Create once. Publish everywhere. Grow intelligently.**

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://postgresql.org)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black.svg)](https://vercel.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A complete SaaS platform for managing multiple social media accounts with AI-powered content generation, automated publishing, and intelligent campaign management.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Deployment](#-deployment) • [Documentation](#-api-documentation) • [Roadmap](#-roadmap)

</div>

---

## 🌐 Live Deployment

**URL:** [https://publift.vercel.app](https://publift.vercel.app)

| Path | Service |
|------|---------|
| `https://publift.vercel.app` | React frontend (SPA) |
| `https://publift.vercel.app/api/*` | Express backend API |
| `https://publift.vercel.app/api/health` | API health check |

Frontend and backend are deployed as a single Vercel project under one branded URL. The frontend is pre-built and served as static files. The backend runs as a Vercel serverless function at `/api/*`.

## 🌟 Features

### 📱 Social Media Integrations
Connect and manage all your social accounts from one dashboard:

- **TikTok** - Video and photo posting with trending sounds
- **YouTube** - Full video uploads, Shorts, and Community posts
- **X (Twitter)** - Tweets, threads, and rich media
- **Instagram** - Posts, Reels, Stories, and Carousels
- **Facebook** - Page posts, videos, and stories
- **LinkedIn** - Professional content and company pages

### 🤖 AI-Powered Creative Studio
Generate professional content in seconds:

- ✍️ **Text Generation** - AI-powered captions, scripts, and descriptions
- 🎨 **Image Creation** - Generate stunning visuals with Stability AI
- 🎬 **Video Production** - AI video generation with Kling AI
- 🎙️ **Voice Generation** - Professional voiceovers with ElevenLabs
- 🔄 **Content Repurposing** - Adapt content for different platforms
- 🌍 **Multi-language** - English, Swahili, French, Spanish, and more
- 🎯 **Brand Voice** - Customizable tone and style

### 📅 Publishing & Scheduling
Complete control over your content calendar:

- 📆 Schedule posts across all platforms simultaneously
- 📊 Calendar view with drag-and-drop
- 🎯 Best time to post AI suggestions
- 📋 Bulk scheduling and CSV import
- ✅ Manual approval workflows
- 🔄 Auto-publish or draft mode
- 📱 Queue management

### 🎯 Campaign Automation
Set it and forget it with intelligent automation:

- 🤖 Automated posting schedules
- 🎨 AI content generation for campaigns
- 🎯 Target audience and niche settings
- 📊 Multi-platform campaigns
- 📈 Real-time performance tracking
- 🔁 Recurring campaign templates

### 📊 Analytics & Insights
Data-driven decisions with comprehensive analytics:

- 📈 Post performance metrics
- 👥 Account growth tracking
- 💬 Engagement rate analysis
- 🔍 Platform comparison
- 📉 Trend identification
- 📄 Export reports (PDF/CSV)
- 📊 Custom date ranges

### 👥 Team Collaboration
Built for teams and agencies:

- 👤 Invite unlimited team members
- 🔐 Role-based permissions (Admin, Editor, Viewer)
- ✅ Approval workflows
- 📝 Activity logs and audit trails
- 💼 Multi-client management
- 🏷️ White-label options (Agency plan)

### 💳 Advertising Integration
Create and manage social media ads:

- 📢 Multi-platform ad campaigns
- 💰 Budget management
- 🎯 Audience targeting
- 📊 Ad performance tracking
- 🔄 A/B testing support

---

## 🏗️ Architecture

```
publift/
├── api/index.js               # Vercel serverless entry point (Express API)
├── backend/                    # Node.js + Express REST API
│   ├── src/
│   │   ├── adapters/          # Platform-specific OAuth & Publishing
│   │   │   ├── tiktok.js      # TikTok API integration
│   │   │   ├── youtube.js     # YouTube Data API v3
│   │   │   ├── instagram.js   # Instagram Graph API
│   │   │   ├── facebook.js    # Facebook Graph API
│   │   │   ├── x.js           # X (Twitter) API v2
│   │   │   └── linkedin.js    # LinkedIn API
│   │   ├── routes/            # RESTful API endpoints
│   │   ├── services/          # Business logic & AI services
│   │   │   ├── aiService.js   # OpenAI, Gemini integration
│   │   │   ├── publishingService.js
│   │   │   ├── campaignAutomation.js  # AI Autopilot
│   │   │   ├── platformAdapterService.js  # Platform adaptation
│   │   │   ├── qualityControlService.js   # Content validation
│   │   │   ├── analyticsService.js
│   │   │   └── scheduler.js   # Cron jobs
│   │   ├── middleware/        # Auth, validation, rate limiting
│   │   ├── database/          # PostgreSQL schema & migrations
│   │   └── utils/             # Encryption, logging
│   └── package.json
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── pages/             # Dashboard, CreativeStudio, Analytics
│   │   ├── components/        # Reusable UI components
│   │   ├── store/             # Zustand state management
│   │   └── lib/               # API client, utilities
│   ├── tailwind.config.js
│   └── package.json
│
├── vercel.json                 # Vercel deployment config
├── package.json                # Root package.json (shared deps for serverless)
└── .vercel-token              # Vercel deployment token (gitignored)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **API Keys** for:
  - OpenAI or Google Gemini (text generation)
  - Stability AI (image generation)
  - Kling AI (video generation)
  - ElevenLabs (voice generation)
  - TikTok Developer Account
  - Google Cloud Console (YouTube)
  - Meta Developer App (Instagram/Facebook)
  - X Developer Portal (Twitter)
  - LinkedIn Developer App
  - Stripe (payments)

### 1️⃣ Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys and database credentials

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Backend runs on `http://localhost:5000`

### 2️⃣ Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### 3️⃣ Database Setup

Option A: **Use Mock Database** (for testing)
```bash
# Leave DATABASE_URL commented in .env
# Mock database will be used automatically
```

Option B: **Use PostgreSQL**
```bash
# Install PostgreSQL
sudo apt install postgresql  # Linux
brew install postgresql       # macOS

# Create database
createdb publift_db

# Update .env
DATABASE_URL=postgresql://user:password@localhost:5432/publift_db

# Run migrations
cd backend && npm run migrate
```

### 4️⃣ Docker Setup (Optional)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📱 Platform Connection Flow

1. **User enters profile URL** - Paste any social media profile link
2. **Auto-detection** - System identifies the platform automatically
3. **OAuth redirect** - Redirects to platform's secure authorization page
4. **User approves** - Grant necessary permissions
5. **Token storage** - Encrypted tokens stored with AES-256-GCM
6. **Ready to publish** - Account connected and ready to use

### Supported URL Formats

```
TikTok:      tiktok.com/@username
YouTube:     youtube.com/@channel or youtube.com/c/channel
Instagram:   instagram.com/username
Facebook:    facebook.com/pagename
X (Twitter): x.com/username or twitter.com/username
LinkedIn:    linkedin.com/in/profile or linkedin.com/company/name
```

### OAuth Callback URLs (Production)

When connecting social accounts on the live deployment, set callback URLs to:

```
https://publift.vercel.app/api/oauth/tiktok/callback
https://publift.vercel.app/api/oauth/youtube/callback
https://publift.vercel.app/api/oauth/instagram/callback
https://publift.vercel.app/api/oauth/facebook/callback
https://publift.vercel.app/api/oauth/x/callback
https://publift.vercel.app/api/oauth/linkedin/callback
https://publift.vercel.app/api/auth/google/callback
```

Update these in each platform's developer console (TikTok, Google Cloud, Meta, X, LinkedIn).

---

## 💳 Subscription Plans

| Plan | Price | AI Credits/mo | Accounts | Team Members | Key Features |
|------|-------|--------------|----------|--------------|-------------|
| **Free** | $0 | 10 | 2 | 1 | Basic posting, limited AI |
| **Starter** | $9 | 50 | 5 | 3 | Scheduling, analytics |
| **Creator Pro** | $19 | 200 | 10 | 5 | AI video, advanced analytics |
| **Business** | $49 | 500 | 25 | 15 | Campaigns, team workflows |
| **Agency** | $99 | Unlimited | Unlimited | Unlimited | White label, priority support |

**AI Credit Usage:**
- Text generation: 1 credit
- Image generation: 3 credits
- Video generation: 10 credits
- Voice generation: 2 credits

---

## 🔐 Security

- 🔒 **JWT Authentication** - Secure token-based auth
- 🔑 **Encrypted Storage** - OAuth tokens encrypted with AES-256-GCM
- 🚦 **Rate Limiting** - Prevent abuse and DDoS
- 🛡️ **CORS Protection** - Configured for production
- 🔐 **Helmet Headers** - Security headers on all responses
- ✅ **PKCE OAuth** - Enhanced OAuth 2.0 security
- 💉 **SQL Injection Prevention** - Parameterized queries
- 🔍 **Input Validation** - All user inputs sanitized

---

## 📊 Database Schema

Core tables and their purpose:

| Table | Purpose |
|-------|---------|
| `users` | User accounts, plans, and settings |
| `social_platforms` | Supported social media platforms |
| `social_accounts` | Connected user accounts per platform |
| `oauth_tokens` | Encrypted access/refresh tokens |
| `posts` | Created content and drafts |
| `publishing_jobs` | Scheduled and published posts |
| `campaigns` | Automated campaign configurations |
| `post_analytics` | Performance metrics and engagement |
| `media_files` | Uploaded and AI-generated media |
| `team_members` | Collaboration and permissions |
| `subscriptions` | Billing and payment history |
| `business_profiles` | Business/brand settings |

---

## 🌐 API Documentation

Full REST API with comprehensive endpoints:

### Authentication
```
POST   /api/auth/register          # Create new account
POST   /api/auth/login             # User login
POST   /api/auth/google            # Google OAuth
GET    /api/auth/me                # Get current user
POST   /api/auth/refresh           # Refresh JWT token
```

### Social Account Management
```
POST   /api/social-accounts        # Connect new account
GET    /api/social-accounts        # List connected accounts
DELETE /api/social-accounts/:id    # Disconnect account
GET    /api/oauth/:platform        # Start OAuth flow
GET    /api/oauth/:platform/callback
```

### Content Creation (AI)
```
POST   /api/content/generate/text  # Generate caption/script
POST   /api/content/generate/image # Generate AI image
POST   /api/content/generate/video # Generate AI video
POST   /api/content/generate/voice # Generate voiceover
POST   /api/content/repurpose      # Adapt for platform
```

### Publishing
```
POST   /api/publishing/schedule    # Schedule post
POST   /api/publishing/publish-now # Publish immediately
GET    /api/publishing/queue       # Get publishing queue
PUT    /api/publishing/:id         # Update scheduled post
DELETE /api/publishing/:id         # Cancel scheduled post
```

### Analytics
```
GET    /api/analytics/overview     # Dashboard metrics
GET    /api/analytics/posts        # Post performance
GET    /api/analytics/accounts     # Account growth
GET    /api/analytics/engagement   # Engagement rates
POST   /api/analytics/export       # Export report
```

### Campaigns
```
POST   /api/campaigns              # Create campaign
GET    /api/campaigns              # List campaigns
GET    /api/campaigns/:id          # Campaign details
PUT    /api/campaigns/:id          # Update campaign
DELETE /api/campaigns/:id          # Delete campaign
POST   /api/campaigns/:id/start    # Start automation
POST   /api/campaigns/:id/pause    # Pause campaign
```

Full documentation: [backend/README.md](backend/README.md)

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **Authentication:** JWT + OAuth 2.0
- **AI Services:**
  - OpenAI GPT-4 (text)
  - Google Gemini (text, primary)
  - Stability AI (images)
  - Kling AI (video)
  - ElevenLabs (voice)
- **Payments:** Stripe
- **Scheduler:** node-cron
- **Security:** bcrypt, Helmet, CORS

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Data Fetching:** React Query
- **Routing:** React Router v6
- **Charts:** Recharts
- **Icons:** Lucide React
- **Forms:** React Hook Form

### DevOps
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx (production)
- **Process Manager:** PM2
- **CI/CD:** GitHub Actions (planned)

---

## 📈 Roadmap

### Q1 2025
- [x] Core platform launch
- [x] 6 platform integrations
- [x] AI content generation
- [ ] Mobile-responsive design optimization
- [ ] Advanced analytics dashboard

### Q2 2025
- [ ] Mobile apps (iOS & Android)
- [ ] Advanced video editing in-app
- [ ] Competitor analysis tool
- [ ] Social listening features
- [ ] Browser extension

### Q3 2025
- [ ] Trend analysis & recommendations
- [ ] AI-powered hashtag research
- [ ] Influencer collaboration tools
- [ ] Advanced A/B testing
- [ ] Custom reporting builder

### Q4 2025
- [ ] White-label enterprise solution
- [ ] API for third-party integrations
- [ ] Advanced team workflows
- [ ] Multi-language UI
- [ ] Marketplace for templates

---

## 🤝 Contributing

This is a proprietary commercial product. Contributions are welcome by invitation only.

If you'd like to contribute:
1. Contact us at dev@publift.io
2. Review our contribution guidelines
3. Sign the Contributor License Agreement (CLA)

---

## 📄 License

**Proprietary License** - All Rights Reserved

Copyright © 2024-2025 Publift. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

---

## 💬 Support & Contact

- **Email:** support@publift.io
- **Documentation:** [docs.publift.io](https://docs.publift.io)
- **Issues:** Report bugs via GitHub Issues
- **Feature Requests:** Use GitHub Discussions

---

## 🙏 Acknowledgments

Built with these amazing technologies:
- OpenAI, Google Gemini, Stability AI, Kling AI, ElevenLabs
- React, Node.js, PostgreSQL, TailwindCSS
- All the social media platform APIs

---

<div align="center">

**Built with ❤️ for content creators, marketers, and agencies worldwide**

⭐ Star this repo if you find it useful!

[Website](https://publift.io) • [Documentation](https://docs.publift.io) • [Twitter](https://twitter.com/publift) • [LinkedIn](https://linkedin.com/company/publift)

</div>

