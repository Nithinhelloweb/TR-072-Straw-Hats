<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/70645153-9aa3-409a-a683-00c2cca813fe

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Render

This project is already configured for deployment on Render:

1. Push your code to GitHub/GitLab
2. Go to [Render dashboard](https://dashboard.render.com/)
3. Click "New +" > "Static Site"
4. Connect your repository
5. Configure:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
6. Add your `GEMINI_API_KEY` environment variable in Render settings
7. Deploy!

The included `render.yaml` file auto-configures all settings for you. Just use the "Blueprint" option on Render for one-click deployment.
