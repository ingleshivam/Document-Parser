# Authentication Setup Guide

This document explains how to set up the authentication system for the Document Parser application.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/document_parser"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# GitHub OAuth
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Email Configuration (for email/password auth)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"
```

## GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the details:
   - Application name: Document Parser
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:3000/api/auth/callback/github
4. Copy the Client ID and Client Secret to your `.env.local` file

## Database Migration

Run the following commands to update your database schema:

```bash
# Generate Prisma client
pnpm prisma generate

# Apply database migrations (if you have a migration system)
pnpm prisma db push
```

## Features

### Authentication Methods

- **Email/Password**: Users can sign up with email and password
- **GitHub OAuth**: Users can sign in with their GitHub account

### User Dashboard

- View personal document statistics
- Track uploaded documents
- Monitor questions asked
- See conversation history
- View processed documents

### User-Specific Data

- All documents, conversations, and messages are now tied to specific users
- Users can only see their own data
- Secure authentication protects user information

## Usage

1. **Sign Up**: Visit `/auth/signup` to create a new account
2. **Sign In**: Visit `/auth/signin` to sign in with email/password or GitHub
3. **Dashboard**: Visit `/dashboard` to view your personal statistics
4. **Document Upload**: Upload documents that will be associated with your account
5. **Chat**: Ask questions about your documents in conversations tied to your account

## Security Features

- Password hashing with bcrypt
- JWT session management
- CSRF protection
- Secure OAuth flows
- User data isolation
