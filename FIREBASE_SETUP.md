# Firebase Setup Instructions

## 🔥 Firebase Configuration Required

Your Firebase authentication is currently not working because the API key and other credentials are not properly configured. Follow these steps to fix it:

### Step 1: Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/project/medsafeai/settings/general)
2. Click on the **Settings gear icon** → **Project settings**
3. Scroll down to **Your apps** section
4. If you don't have a web app, click **Add app** → **Web** and follow the setup
5. In the **Firebase SDK snippet** section, select **Config**
6. Copy the configuration object

### Step 2: Update Your Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Firebase credentials:

```env
# Replace these with your actual Firebase credentials
VITE_FIREBASE_API_KEY=AIzaSy...your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=medsafeai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=medsafeai
VITE_FIREBASE_STORAGE_BUCKET=medsafeai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Step 3: Enable Authentication Methods

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Enable **Google** authentication (add your domain to authorized domains)

### Step 4: Test the Application

1. Restart your development server: `npm run dev`
2. Try both authentication methods:
   - Email/Password signup and login
   - Google Sign-In

## ✅ What's Been Fixed

- ✅ Firebase configuration now uses environment variables
- ✅ Added email/password authentication UI to Login page
- ✅ Added email/password authentication UI to Signup page  
- ✅ Updated AuthContext to support both Google and email/password auth
- ✅ Maintained existing Supabase integration for database/storage
- ✅ Added proper error handling and validation

## 🚨 Important Notes

- **Supabase integration is unchanged** - Firebase is only used for authentication
- **Both authentication methods work** - Users can choose email/password OR Google
- **Environment variables are required** - The app will show errors until you set them up
- **Restart required** - After updating .env, restart your dev server

## 🔍 Troubleshooting

If you still see the "auth/api-key-not-valid" error:
1. Double-check your API key in the .env file
2. Make sure there are no extra spaces or quotes
3. Restart your development server
4. Check the browser console for specific error messages

If Google Sign-In doesn't work:
1. Ensure Google authentication is enabled in Firebase Console
2. Add your domain (localhost:5173) to authorized domains
3. Check that your OAuth consent screen is configured
