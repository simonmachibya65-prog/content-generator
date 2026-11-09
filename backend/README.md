# Cotents Backend API

AI-powered social media management platform backend.

## Features

- User authentication (JWT)
- OAuth 2.0 integrations for 6 social platforms
- AI content generation (OpenAI)
- Automated publishing scheduler
- Analytics tracking
- Campaign management
- Team collaboration
- Stripe payments

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Setup Database

Create a PostgreSQL database and run migrations:

```bash
npm run migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will run on `http://localhost:5000`

## API Documentation

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### OAuth Connections
- `POST /api/oauth/detect` - Detect platform from URL
- `GET /api/oauth/:platform/authorize` - Start OAuth flow
- `GET /api/oauth/:platform/callback` - OAuth callback
- `DELETE /api/oauth/:platform/disconnect/:id` - Disconnect account

### Social Accounts
- `GET /api/social-accounts` - List connected accounts
- `GET /api/social-accounts/:id` - Get account details
- `POST /api/social-accounts/sync/:id` - Sync account data

### Content
- `POST /api/content/generate` - Generate AI content
- `POST /api/content/generate-hashtags` - Generate hashtags
- `POST /api/content/generate-script` - Generate video script
- `POST /api/content/generate-image` - Generate AI image
- `POST /api/content/repurpose` - Repurpose content
- `POST /api/content/posts` - Create post
- `GET /api/content/posts` - List posts
- `GET /api/content/posts/:id` - Get post
- `PUT /api/content/posts/:id` - Update post
- `DELETE /api/content/posts/:id` - Delete post

### Publishing
- `POST /api/publishing/publish` - Publish/schedule post
- `GET /api/publishing/queue` - Get publishing queue
- `GET /api/publishing/calendar` - Get calendar events
- `DELETE /api/publishing/jobs/:id` - Cancel job

### Analytics
- `GET /api/analytics/overview` - Dashboard stats
- `GET /api/analytics/posts` - Top posts
- `GET /api/analytics/growth` - Account growth
- `GET /api/analytics/platforms` - Platform comparison

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/generate-content` - Generate campaign content
- `POST /api/campaigns/:id/pause` - Pause campaign
- `POST /api/campaigns/:id/resume` - Resume campaign

### Media
- `POST /api/media/upload` - Upload file
- `GET /api/media` - List media
- `DELETE /api/media/:id` - Delete media

### Team (Business+ plans)
- `GET /api/team` - List team members
- `POST /api/team/invite` - Invite member
- `DELETE /api/team/:id` - Remove member

### Billing
- `POST /api/billing/create-checkout` - Start subscription checkout
- `GET /api/billing/subscription` - Get subscription details
- `POST /api/billing/webhook` - Stripe webhook

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

## Platform Integrations

### TikTok
- Authorization endpoint with PKCE
- Video publishing
- Profile sync

### YouTube
- Google OAuth
- Video upload
- Channel management

### X (Twitter)
- OAuth 2.0 with PKCE
- Tweet posting
- Media upload

### Instagram
- Meta OAuth
- Image & Reel publishing
- Business account required

### Facebook
- Meta OAuth
- Page posting
- Video publishing

### LinkedIn
- OAuth 2.0
- Post sharing
- Profile access

## Scheduler

Background cron jobs run automatically:
- **Every minute**: Process due publishing jobs
- **Daily at 2 AM**: Sync analytics from platforms
- **Every 6 hours**: Campaign content automation

## Security

- JWT authentication
- Encrypted OAuth tokens (AES-256-GCM)
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention (parameterized queries)

## License

Proprietary - All Rights Reserved
