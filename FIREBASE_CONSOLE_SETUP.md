# 🔥 Firebase Console Setup Required

## Current Issue
You're getting the error: `Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`

This error typically occurs when:
1. **Email/Password authentication is not enabled** in Firebase Console
2. API key restrictions are blocking the request
3. The Firebase project configuration is incomplete

## ✅ Step-by-Step Firebase Console Setup

### 1. Enable Email/Password Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/project/medsafeai)
2. Click **Authentication** in the left sidebar
3. Click the **Sign-in method** tab
4. Find **Email/Password** in the list
5. Click on it and **Enable** it
6. Click **Save**

### 2. Enable Google Authentication (Optional)
1. In the same **Sign-in method** tab
2. Find **Google** in the list
3. Click on it and **Enable** it
4. Add your email as a project support email
5. Click **Save**

### 3. Configure Authorized Domains
1. Still in the **Sign-in method** tab
2. Scroll down to **Authorized domains**
3. Make sure these domains are listed:
   - `localhost` (for development)
   - `medsafeai.firebaseapp.com` (default)
   - Add your production domain when ready

### 4. Verify API Key Settings
1. Go to **Project Settings** (gear icon)
2. Click the **General** tab
3. Scroll to **Your apps** section
4. Verify the **Web API Key** matches your .env file:
   ```
   AIzaSyAMrkyqIjIXK5uJaI7GSlRAia2Gl6Yf8sg
   ```

### 5. Check API Key Restrictions (Important!)
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=medsafeai)
2. Find your API key in the list
3. Click on it to edit
4. Under **Application restrictions**:
   - Either select **None** (for development)
   - Or select **HTTP referrers** and add:
     - `http://localhost:5173/*`
     - `https://localhost:5173/*`
     - `https://medsafeai.firebaseapp.com/*`
5. Under **API restrictions**:
   - Either select **Don't restrict key**
   - Or select specific APIs and ensure these are enabled:
     - Identity and Access Management (IAM) API
     - Firebase Authentication API
     - Firebase Management API

## 🧪 Test After Setup

1. **Restart your development server**: `npm run dev`
2. **Open the test page**: http://localhost:5173/firebase-test
3. **Click "Test Email Signup"** and check the console logs
4. **Try the actual signup page**: http://localhost:5173/signup

## 🔍 Debugging Steps

If you still get errors:

1. **Check browser console** for detailed error messages
2. **Check the Firebase test page** at `/firebase-test`
3. **Verify environment variables** are loaded correctly
4. **Check Firebase Console logs** in the Authentication section

## 📋 Checklist

- [ ] Email/Password authentication enabled in Firebase Console
- [ ] Google authentication enabled (optional)
- [ ] Authorized domains configured (localhost added)
- [ ] API key restrictions configured properly
- [ ] Development server restarted after changes
- [ ] Browser cache cleared (Ctrl+Shift+R)

## 🚨 Common Issues

**"API key not valid"** usually means:
- Email/Password auth is not enabled ← **Most common cause**
- API key has HTTP referrer restrictions that block localhost
- Wrong API key copied from Firebase Console

**"Domain not authorized"** means:
- localhost is not in the authorized domains list
- Wrong auth domain in configuration

The most likely fix is **enabling Email/Password authentication** in Firebase Console!
