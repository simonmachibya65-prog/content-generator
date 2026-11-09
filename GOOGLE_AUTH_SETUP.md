# Google Sign-In Setup Guide

## ✅ What Was Added

**"Continue with Google"** authentication allows users to sign up and log in instantly using their Google account.

### Features:
- ✅ One-click sign up/login
- ✅ No password required
- ✅ Automatic account creation
- ✅ Profile picture imported from Google
- ✅ Email verified automatically
- ✅ Seamless Quick Start redirect for new users

---

## 🔐 How It Works

### User Flow:

```
1. User clicks "Continue with Google"
   ↓
2. Redirected to Google OAuth consent screen
   ↓
3. User approves access (one-time)
   ↓
4. Google returns authorization code
   ↓
5. Backend exchanges code for user info
   ↓
6. Account created/logged in automatically
   ↓
7. New users → Quick Start Wizard
   Existing users → Dashboard
```

### For Users:
- **Sign Up:** Click Google button → Approve → Done (10 seconds)
- **Login:** Click Google button → Auto-login → Dashboard (5 seconds)

---

## 🛠️ Google Cloud Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"**
3. Name: `Cotents` (or your platform name)
4. Click **Create**

### Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for **"Google+ API"** or **"People API"**
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for public users)
3. Fill in:
   - **App name:** Cotents
   - **User support email:** your@email.com
   - **Developer contact:** your@email.com
4. Click **Save and Continue**

5. **Scopes:** Add these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Click **Save and Continue**

7. **Test users** (for development):
   - Add your Gmail address
8. Click **Save and Continue**

### Step 4: Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Cotents Web Client`

5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://yourdomain.com
   ```

6. **Authorized redirect URIs:**
   ```
   http://localhost:5000/api/auth/google/callback
   https://api.yourdomain.com/api/auth/google/callback
   ```

7. Click **Create**

8. **Copy these values:**
   - Client ID: `123456789-abc...apps.googleusercontent.com`
   - Client Secret: `GOCSPX-...`

---

## 🔧 Backend Configuration

### Update `.env` file:

```bash
# Google OAuth (for user authentication)
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_AUTH_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Frontend URL (for redirects)
APP_URL=http://localhost:3000
```

### For Production:
```bash
GOOGLE_AUTH_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/callback
APP_URL=https://yourdomain.com
```

---

## 📁 Files Modified/Created

### Backend:
✅ `backend/src/routes/auth.js` - Added Google OAuth routes:
   - `GET /api/auth/google` - Initiates Google login
   - `GET /api/auth/google/callback` - Handles OAuth callback

✅ `backend/.env.example` - Added Google auth variables

### Frontend:
✅ `frontend/src/pages/Login.jsx` - Added "Continue with Google" button
✅ `frontend/src/pages/Register.jsx` - Added "Continue with Google" button
✅ `frontend/src/pages/GoogleAuthSuccess.jsx` - Success handler page
✅ `frontend/src/App.jsx` - Added `/auth/google/success` route

---

## 🎨 UI Updates

### Login Page:
```
┌──────────────────────────────────────┐
│         Cotents Logo                 │
│   AI Social Media Management         │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  🔵 Continue with Google       │ │
│  └────────────────────────────────┘ │
│                                      │
│     ───── Or continue with email ──  │
│                                      │
│  Email: [_________________]          │
│  Password: [_________________]       │
│  [Login]                             │
└──────────────────────────────────────┘
```

### Register Page:
```
┌──────────────────────────────────────┐
│        Create Account                │
│   Start managing social media        │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  🔵 Continue with Google       │ │
│  └────────────────────────────────┘ │
│                                      │
│     ───── Or continue with email ──  │
│                                      │
│  Full Name: [_________________]      │
│  Email: [_________________]          │
│  Password: [_________________]       │
│  [Create Account]                    │
└──────────────────────────────────────┘
```

---

## 🔄 Authentication Flow

### First Time User (Google):
```
1. Click "Continue with Google"
   ↓
2. Google: "Cotents wants to access..."
   ↓
3. User clicks "Allow"
   ↓
4. Account created automatically:
   - Full name from Google
   - Email from Google
   - Avatar from Google profile
   - Email verified = TRUE
   - Random password generated
   ↓
5. Redirected to Quick Start Wizard
```

### Returning User (Google):
```
1. Click "Continue with Google"
   ↓
2. Auto-recognized by Google
   ↓
3. Instant login (no approval needed)
   ↓
4. Redirected to Dashboard
```

---

## 🧪 Testing

### Development Testing:

1. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Google Login:**
   - Go to `http://localhost:3000/login`
   - Click "Continue with Google"
   - Sign in with test Google account
   - Should redirect to Quick Start or Dashboard

### Test Accounts:
During development, only Google accounts added as **Test Users** in Google Cloud Console can sign in.

For production, publish the OAuth consent screen to allow any Google account.

---

## 🌐 Production Deployment

### 1. Update Google Cloud Console:

Add production URLs to:
- **Authorized JavaScript origins:**
  ```
  https://yourdomain.com
  ```
- **Authorized redirect URIs:**
  ```
  https://api.yourdomain.com/api/auth/google/callback
  ```

### 2. Update Environment Variables:

```bash
GOOGLE_CLIENT_ID=same_as_development
GOOGLE_CLIENT_SECRET=same_as_development
GOOGLE_AUTH_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/callback
APP_URL=https://yourdomain.com
```

### 3. Publish OAuth Consent Screen:

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Submit for verification (if needed)

---

## 🔒 Security Notes

### What Google Provides:
- User's email (verified)
- User's full name
- User's profile picture
- Unique Google ID

### What We Store:
- Email
- Full name
- Avatar URL
- Random generated password (not used)
- `email_verified = TRUE`

### Security Best Practices:
✅ OAuth tokens never exposed to frontend  
✅ JWT tokens generated server-side  
✅ Secure redirect validation  
✅ HTTPS required in production  
✅ Client secret never in frontend code  

---

## 🎯 Benefits

### For Users:
- ✅ **Faster signup** - 10 seconds vs 2 minutes
- ✅ **No password to remember**
- ✅ **No email verification needed**
- ✅ **Profile picture imported**
- ✅ **One-click future logins**

### For Platform:
- ✅ **Higher conversion rate** (Google login converts 2-3x better)
- ✅ **Verified emails** (reduces spam accounts)
- ✅ **Better user experience**
- ✅ **Lower support burden** (no password resets)

---

## 📊 Usage Tracking

### Check Google Sign-In Usage:

```sql
-- Count Google vs Email signups
SELECT 
  CASE 
    WHEN password_hash LIKE '$2%' THEN 'Email'
    ELSE 'Google'
  END as signup_method,
  COUNT(*) as count
FROM users
GROUP BY signup_method;
```

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution:** Ensure the redirect URI in code matches exactly in Google Console.

### Error: "invalid_client"
**Solution:** Check that Client ID and Secret are correct in `.env`.

### Error: "access_denied"
**Solution:** User declined authorization. Normal behavior.

### Not redirecting to Quick Start
**Solution:** Check `GoogleAuthSuccess.jsx` is correctly checking for existing accounts.

---

## ✅ Testing Checklist

- [ ] Google button appears on Login page
- [ ] Google button appears on Register page
- [ ] Clicking button redirects to Google
- [ ] After approval, redirects back
- [ ] New users go to Quick Start
- [ ] Existing users go to Dashboard
- [ ] Avatar imported from Google
- [ ] Email marked as verified
- [ ] Can login again with same Google account

---

**Google Sign-In is now fully integrated!** 🎉
