# Cotents - AI Social Media Management Platform

**Create once. Enhance professionally. Publish everywhere. Grow intelligently.**

A complete SaaS platform for managing multiple social media accounts with AI-powered content generation and automated publishing.

## 🌟 Features

### Social Media Integrations
- **TikTok** - Video and photo posting
- **YouTube** - Video uploads and Shorts
- **X (Twitter)** - Tweets and media
- **Instagram** - Posts, Reels, and Stories
- **Facebook** - Page posts and videos
- **LinkedIn** - Professional content sharing

### AI Content Creation
- Text post generation for all platforms
- AI image generation (DALL-E)
- Video script writing
- Hashtag generation
- Content repurposing
- Multi-language support (English, Swahili, French, etc.)
- Customizable brand voice and tone

### Publishing & Scheduling
- Schedule posts across all platforms
- Bulk scheduling
- Publishing queue management
- Best time to post suggestions
- Auto-publish or manual approval
- Calendar view

### Campaign Automation
- Create automated content campaigns
- Set posting frequency
- Define target audience and niche
- Multi-platform campaigns
- Performance tracking

### Analytics & Reports
- Post performance metrics
- Account growth tracking
- Engagement analytics
- Platform comparison
- Export reports (PDF/CSV)

### Team Collaboration (Business+ plans)
- Invite team members
- Role-based permissions
- Approval workflows
- Activity logs

## 🏗️ Architecture

```
cotents/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── adapters/      # Platform OAuth & Publishing
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth, validation
│   │   └── database/      # PostgreSQL schema
│   └── package.json
│
└── frontend/         # React + Vite
    ├── src/
    │   ├── pages/         # Dashboard, Create, Analytics, etc.
    │   ├── components/    # Reusable UI components
    │   ├── store/         # Zustand state management
    │   └── lib/           # API client, utilities
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- API keys for:
  - OpenAI (content generation)
  - TikTok Developer
  - Google Cloud (YouTube)
  - Meta (Instagram/Facebook)
  - X Developer
  - LinkedIn Developer
  - Stripe (payments)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run migrate
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📱 Platform Connection Flow

1. User pastes their social media profile URL
2. System detects the platform automatically
3. Redirects to platform's OAuth authorization
4. User approves permissions
5. System stores encrypted tokens securely
6. Account is connected and ready to publish

## 💳 Subscription Plans

| Plan | Price/month | AI Credits | Accounts | Features |
|------|-------------|------------|----------|----------|
| Free | $0 | 10 | 2 | Basic features |
| Starter | $9 | 50 | 5 | Scheduling + Analytics |
| Creator Pro | $19 | 200 | 10 | AI Video + Advanced analytics |
| Business | $49 | 500 | 25 | Team + Campaigns |
| Agency | $99 | Unlimited | Unlimited | White label + Priority support |

## 🔐 Security

- JWT authentication
- Encrypted OAuth tokens (AES-256-GCM)
- Rate limiting
- CORS protection
- Helmet security headers
- PKCE for OAuth flows
- SQL injection prevention

## 📊 Database Schema

- **users** - User accounts and plans
- **social_platforms** - Supported platforms
- **social_accounts** - Connected user accounts
- **oauth_tokens** - Encrypted access/refresh tokens
- **posts** - Created content
- **publishing_jobs** - Scheduled/published posts
- **campaigns** - Automation campaigns
- **post_analytics** - Performance metrics
- **media_files** - Uploaded/generated media
- **team_members** - Collaboration
- **subscriptions** - Billing

## 🌐 API Documentation

Full API documentation available in `backend/README.md`

Key endpoints:
- `/api/auth/*` - Authentication
- `/api/oauth/*` - Social account connections
- `/api/content/*` - AI content generation
- `/api/publishing/*` - Post scheduling
- `/api/analytics/*` - Performance data
- `/api/campaigns/*` - Campaign management

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- PostgreSQL
- JWT authentication
- OpenAI API
- OAuth 2.0 (all platforms)
- Stripe payments
- Node-cron scheduler

### Frontend
- React 18
- Vite
- TailwindCSS
- React Query
- Zustand
- React Router
- Recharts
- Lucide Icons

## 📈 Roadmap

- [ ] Mobile apps (iOS & Android)
- [ ] Advanced video editing
- [ ] AI voiceover generation
- [ ] Trend analysis & recommendations
- [ ] Competitor tracking
- [ ] Social listening
- [ ] White-label solution

## 🤝 Contributing

This is a proprietary commercial product. Contributions are by invitation only.

## 📄 License

Proprietary - All Rights Reserved

## 💬 Support

For support, email: support@cotents.io

---

**Built with ❤️ for content creators and marketing agencies worldwide**
