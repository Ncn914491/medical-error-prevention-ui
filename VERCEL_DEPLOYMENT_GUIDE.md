# Vercel Deployment Guide

Your app has been successfully deployed to Vercel! 🎉

**Production URL**: https://medical-error-prevention-mb4la97s5-ncn914491s-projects.vercel.app

## Setting Up Environment Variables

Your app requires several environment variables to function properly. You need to add these in the Vercel dashboard:

### Steps to Add Environment Variables:

1. Go to your [Vercel Dashboard](https://vercel.com/ncn914491s-projects/medical-error-prevention-ui)
2. Click on the "Settings" tab
3. Navigate to "Environment Variables" in the left sidebar
4. Add the following variables:

#### Required Environment Variables:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=(get from your .env file)
VITE_FIREBASE_AUTH_DOMAIN=(get from your .env file)
VITE_FIREBASE_PROJECT_ID=(get from your .env file)
VITE_FIREBASE_STORAGE_BUCKET=(get from your .env file)
VITE_FIREBASE_MESSAGING_SENDER_ID=(get from your .env file)
VITE_FIREBASE_APP_ID=(get from your .env file)

# Supabase Configuration
VITE_SUPABASE_URL=(get from your .env file)
VITE_SUPABASE_ANON_KEY=(get from your .env file)
VITE_SUPABASE_STORAGE_BUCKET=(get from your .env file)

# Groq API Configuration
VITE_GROQ_API_KEY=(get from your .env file)
```

**Note**: Copy the actual values from your local `.env` file. Don't share these values publicly!

5. After adding all variables, click "Save"
6. **Important**: Redeploy your application by clicking "Redeploy" in the Deployments tab

## Custom Domain (Optional)

You can add a custom domain:
1. Go to Settings > Domains
2. Add your domain
3. Follow the DNS configuration instructions

## Automatic Deployments

Your app is set up for automatic deployments:
- Every push to the `master` branch will trigger a new deployment
- Pull requests will get preview deployments

## Local Development

To run locally:
```bash
npm install
npm run dev
```

## Build Commands

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Troubleshooting

If your app isn't working after deployment:
1. Check that all environment variables are set correctly
2. Check the Function Logs in Vercel dashboard
3. Ensure you've redeployed after adding environment variables

## Security Notes

⚠️ **Important**: The environment variables in this guide contain real API keys. In production:
- Consider rotating these keys regularly
- Use different keys for development and production
- Never commit API keys to version control
