# Local Development and Vercel Deployment Setup

This document explains how to run and test your backend locally and deploy it on Vercel with the current project structure.

## Project Structure Overview

- `server.js`: Main Express server handling most backend routes and functionality. Intended for local development or traditional hosting.
- `api/`: Directory containing serverless function files (e.g., `forms/submit-form.js`, `forms/register-token.js`) for Vercel deployment and local testing of serverless endpoints.

## Running Locally

### 1. Run Main Server

This runs your main backend server with all existing routes except the forms routes.

```bash
node server.js
```

The server listens on the port defined in your environment (default 5000).

### 2. Run Forms Serverless Functions Locally

To test the serverless functions locally, you can use the Vercel CLI:

1. Install Vercel CLI if not installed:

```bash
npm install -g vercel
```

2. Run the development server:

```bash
vercel dev
```

This will serve the `api/` directory as serverless functions locally, accessible at `http://localhost:3000/api/forms/submit-form` etc.

Alternatively, you can create a minimal Express server to run the `api` routes locally (optional).

## Deploying to Vercel

- Vercel automatically treats files under the `api/` directory as serverless functions.
- Deploy your project to Vercel as usual.
- The serverless functions will be available at `/api/forms/submit-form`, `/api/forms/register-token`, etc.
- The main `server.js` is not used by Vercel and can be ignored in deployment.

## Summary

| Environment | Server to Run | Notes |
|-------------|---------------|-------|
| Local Development (main backend) | `node server.js` | Runs main backend without forms routes |
| Local Development (serverless functions) | `vercel dev` | Runs serverless functions locally |
| Vercel Deployment | Vercel platform | Deploys serverless functions from `api/` directory |

## Additional Tips

- You can create npm scripts to simplify running both servers.
- For unified local development, consider using a proxy or monorepo setup.

If you need help setting up scripts or proxies, please ask.
