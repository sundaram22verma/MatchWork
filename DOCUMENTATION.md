# MatchWork - Comprehensive Technical Documentation & Assessment Guide

Welcome to the **MatchWork** technical documentation. This document covers the architecture, setup, CI/CD pipeline, Vercel deployment configuration, and assessment submission details.

---

## Table of Contents

1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Tech Stack](#2-tech-stack)
3. [CI/CD Pipeline (GitHub Actions)](#3-cicd-pipeline-github-actions)
4. [Vercel Deployment Guide](#4-vercel-deployment-guide)
   1. [Performance Metrics Collection](#41-performance-metrics-collection)
5. [Local Development & Build Instructions](#5-local-development--build-instructions)
6. [Environment Variables](#6-environment-variables)
7. [Database Schema & Seed Data](#7-database-schema--seed-data)
8. [Final Assessment Submission Checklist & Copy](#8-final-assessment-submission-checklist--copy)

---

## 1. Project Overview & Architecture

**MatchWork** is an AI-powered job matching platform connecting candidates with employers based on skill vector matching, automated profile analysis, and real-time application tracking.

### Core Features:
- **Candidate Portal**: Profile creation, skill tagger, match score calculator, and one-click application system.
- **Employer Portal**: Job posting management, automated candidate match ranking, and applicant tracking.
- **AI Matching Engine**: Vector-based semantic similarity and TF-IDF calculation comparing candidate resume attributes against employer job specifications.
- **Authentication & RBAC**: Integrated Supabase Auth supporting candidate and employer role isolation.

---

## 2. Tech Stack

- **Frontend / SSR**: React 19, TanStack Start, TanStack Router, Vite
- **Styling**: Tailwind CSS v4, Lucide Icons, Sonner Toast Notifications
- **Backend / Database**: Supabase PostgreSQL, Row Level Security (RLS), Supabase Auth
- **AI & Embeddings**: `@xenova/transformers` (client/edge embeddings), custom scoring algorithm
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel

---

## 3. CI/CD Pipeline (GitHub Actions)

The repository includes an automated GitHub Actions workflow located at `.github/workflows/deploy.yml`.

### Workflow Stages:
1. **Lint & Build Verification (`lint-and-build`)**:
   - Triggers on every `push` and `pull_request` to the `main` branch.
   - Installs dependencies using `npm ci`.
   - Runs ESLint code quality checks (`npm run lint`).
   - Executes build verification (`npm run build`).

2. **Automated Vercel Deployment (`deploy`)**:
   - Triggers automatically upon successful completion of the build job when code is pushed to `main`.
   - Uses Vercel CLI to pull environment settings, build production artifacts, and deploy to Vercel without manual intervention.

---

## 4. Vercel Deployment Guide

Follow these steps to complete the Vercel deployment via CI/CD:

### Step 4.1: Obtain Vercel Credentials
1. **Vercel Access Token**: Go to Vercel Dashboard -> **Account Settings** -> **Tokens** -> Create token (`VERCEL_TOKEN`).
2. **Vercel Org ID & Project ID**:
   - Link your project locally once via `npx vercel link` OR find them in Vercel Dashboard under **Project Settings** -> **General** (Project ID & Team/Org ID).

### Step 4.2: Add GitHub Repository Secrets
Navigate to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Secret Name | Description |
| :--- | :--- |
| `VERCEL_TOKEN` | Personal Access Token from Vercel |
| `VERCEL_ORG_ID` | Vercel Organization / Team ID |
| `VERCEL_PROJECT_ID` | Vercel Project ID |
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anonymous Key |

### Step 4.3: Trigger Automatic Deployment
Pushing code to `main` will automatically trigger the GitHub Action and deploy to Vercel!

---

## 4.1 Performance Metrics Collection

To enable browser performance telemetry for the deployed site, install and initialize Vercel Speed Insights.

1. Install the package:
   ```bash
   npm install @vercel/speed-insights
   ```
2. The repository's root client shell dynamically imports and calls `injectSpeedInsights()` in the browser.
3. Deploy your changes and open the live site. Allow about 30 seconds for initial metrics to appear.
4. If no data arrives, disable ad/content blockers and navigate through multiple pages.

---

## 5. Local Development & Build Instructions

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Code Linting
npm run lint

# 4. Build Production Bundle
npm run build
```

---

## 6. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 7. Database Schema & Seed Data

- Database migrations are located in `supabase/migrations/`.
- Full SQL schema is located in `supabase/schema_matchwork.sql`.
- Pre-populated test profiles and credentials are in `test_credentials.json`.

---

## 8. Final Assessment Submission Checklist & Copy

Use the template below when sending your assessment response:

```text
Subject: Submission: MatchWork Assessment Steps Complete

Dear Hiring / Assessment Team,

I have completed all assessment steps for MatchWork:

1. Build Matchwork: Completed (Full web app with AI matching engine, TanStack Start & Supabase integration).
2. Push Code to Git: Completed (Repository: https://github.com/sundaram22verma/MatchWork).
3. CI/CD Pipeline: Written using GitHub Actions (.github/workflows/deploy.yml).
4. Deploy to Vercel: Configured automatic Vercel production deployment pipeline.
5. Documentation: Complete technical documentation & architecture guide created (DOCUMENTATION.md).

GitHub Repository: https://github.com/sundaram22verma/MatchWork
Live Demo URL: [Insert your Vercel Deployment Link Here]

Best regards,
Sundaram Verma
```
