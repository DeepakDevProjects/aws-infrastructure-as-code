# GitHub Webhook Setup for Automatic Pipeline Triggering

## Overview

This guide shows you how to set up automatic pipeline triggering:
1. **PR Created in Lambda App Repo** → **Triggers Lambda App Pipeline**
2. **Lambda App Pipeline** → **Automatically Triggers Infrastructure Pipeline**

---

## Step 1: Configure Infrastructure Pipeline Parameter

The infrastructure pipeline must accept PR_NUMBER as a parameter:

1. Go to Jenkins Dashboard
2. Click **infrastructure-pipeline**
3. Click **Configure**
4. Check **This project is parameterized**
5. Click **Add Parameter** → **String Parameter**
6. Configure:
   - **Name**: `PR_NUMBER`
   - **Default Value**: `default`
   - **Description**: `PR Number for deployment (e.g., 123)`
7. Click **Save**

---

## Step 2: Configure Lambda App Pipeline for GitHub Triggers

### Option A: Standard GitHub Hook (Current Setup)

1. Go to Jenkins Dashboard
2. Click **lambda-app-pipeline**
3. Click **Configure**
4. Scroll to **Build Triggers** section
5. Check **GitHub hook trigger for GITScm polling**
   - This allows GitHub webhooks to trigger the pipeline
6. Click **Save**

**Note:** This setup works, but PR number detection relies on:
- Webhook environment variables (CHANGE_ID - may not always be set)
- GitHub API call (fallback)
- Branch name extraction (fallback)

### Option B: GitHub Pull Request Builder Plugin (Recommended - Always Gets PR Number)

This plugin **always** sets `ghprbPullId` environment variable with the PR number when a PR webhook is received.

#### 2b.1: Install GitHub Pull Request Builder Plugin

1. Go to **Manage Jenkins** → **Manage Plugins**
2. Click **Available** tab
3. Search for: `GitHub Pull Request Builder`
4. Check the box and click **Install without restart** (or **Download now and install after restart**)
5. Wait for installation to complete
6. Restart Jenkins if needed

#### 2b.2: Configure Lambda App Pipeline with PR Builder

1. Go to Jenkins Dashboard
2. Click **lambda-app-pipeline**
3. Click **Configure**
4. Scroll to **Build Triggers** section
5. Check **GitHub Pull Request Builder**
6. Configure:
   - **GitHub API URL**: `https://api.github.com` (default)
   - **Credentials**: Select your GitHub token credential (e.g., `github-token`)
   - **Admin list**: Add your GitHub username (e.g., `DeepakDevProjects`)
   - **Trigger phrase**: (leave empty to trigger on all PRs)
   - **Allow members of whitelisted organizations**: (optional)
   - **Build every pull request**: ✅ Check this
   - **Skip build if only doc files changed**: (optional)
7. Also check **GitHub hook trigger for GITScm polling** (for push events)
8. Click **Save**

#### 2b.3: Update GitHub Webhook URL

When using GitHub Pull Request Builder, the webhook URL is different:

1. Go to your GitHub repository → **Settings** → **Webhooks**
2. Edit your existing webhook (or create new)
3. Change **Payload URL** to: `https://YOUR_NGROK_URL.ngrok.io/ghprbhook/`
   - **Note:** Use `/ghprbhook/` instead of `/github-webhook/`
4. **Events**: Select **Pull requests** (required for PR Builder)
5. Click **Update webhook**

**Result:** When a PR is created/updated, the plugin automatically sets `ghprbPullId` environment variable with the PR number, which your Jenkinsfile already checks for!

### Comparison: Option A vs Option B

| Feature | Option A (Standard Hook) | Option B (PR Builder Plugin) |
|---------|-------------------------|----------------------------|
| **PR Number Detection** | Relies on fallbacks (API call, branch name) | ✅ Always sets `ghprbPullId` |
| **Webhook URL** | `/github-webhook/` | `/ghprbhook/` |
| **Setup Complexity** | Simple | Requires plugin installation |
| **Reliability** | Good (with fallbacks) | ✅ Excellent (always works) |
| **Works with Push Events** | ✅ Yes | ✅ Yes (if also enabled) |
| **Works with PR Events** | ⚠️ May need API call | ✅ Yes (native support) |

**Recommendation:** Use **Option B (GitHub Pull Request Builder)** if you want guaranteed PR number detection without relying on API calls or branch name parsing.

---

## Step 3: Configure GitHub Webhook (Using ngrok for Local Jenkins)

**IMPORTANT:** For local Jenkins, you need to expose Jenkins to the internet using ngrok, because GitHub cannot reach `localhost`.

### Install ngrok:

```bash
# macOS
brew install ngrok

# Or download from: https://ngrok.com/download
```

### Start ngrok:

```bash
# Expose Jenkins on port 8080
ngrok http 8080
```

This will give you a public URL like: `https://abc123.ngrok.io`

### Configure GitHub Webhook:

1. Go to your Lambda app repository on GitHub:
   - `https://github.com/DeepakDevProjects/aws-serverless-lambda-app`
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://YOUR_NGROK_URL.ngrok.io/github-webhook/`
     - Example: `https://abc123.ngrok.io/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: Select **Let me select individual events**
     - ✅ Check **Pull requests**
     - ✅ Check **Pushes** (optional - for testing)
   - ✅ **Active**
4. Click **Add webhook**

**Note:** ngrok URL changes every time you restart it (unless you have a paid plan). For production, use a fixed URL or configure your Jenkins server with a public IP.

---

## Step 4: Alternative - Configure Jenkins GitHub Server (Without ngrok)

If you don't want to use ngrok, you can configure Jenkins to poll GitHub:

1. Go to **Manage Jenkins** → **Configure System**
2. Scroll to **GitHub** section
3. Click **Add GitHub Server**
4. Configure:
   - **Name**: `GitHub` (or any name)
   - **API URL**: `https://api.github.com`
   - **Credentials**: Click **Add** → **Jenkins**
     - **Kind**: Secret text
     - **Secret**: Your GitHub Personal Access Token
     - **ID**: `github-api-token`
     - Click **Add**
   - Select the credentials you just created
   - ✅ Check **Manage hooks**
   - ✅ Check **Specify another hook URL as:** (if you have a public URL)
5. Click **Save**

Then in pipeline configuration:
- Check **Build when a change is pushed to GitHub**
- Or use **GitHub hook trigger for GITScm polling**

---

## Step 5: Test the Complete Flow

### Test 1: Create a PR in Lambda App Repo

1. Go to `https://github.com/DeepakDevProjects/aws-serverless-lambda-app`
2. Create a new branch: `feature/test-pr-123`
3. Make a small change (e.g., edit README.md)
4. Commit and push
5. Create a Pull Request with PR number (e.g., PR #123)
6. **Expected:** 
   - GitHub webhook triggers Jenkins
   - Lambda app pipeline starts automatically
   - Infrastructure pipeline is triggered automatically

### Test 2: Manual Trigger (Alternative)

If webhook doesn't work:

1. Go to Jenkins Dashboard
2. Click **lambda-app-pipeline**
3. Click **Build with Parameters**
4. Enter **PR_NUMBER**: `123` (or your PR number)
5. Click **Build**
6. **Expected:**
   - Lambda app pipeline runs
   - Infrastructure pipeline is triggered automatically (Stage 7)
   - Both pipelines complete

---

## How It Works

```
┌─────────────────────────┐
│ GitHub PR Created       │
│ (Lambda App Repo)       │
└──────────┬──────────────┘
           │
           │ (GitHub Webhook)
           ▼
┌─────────────────────────┐
│ Lambda App Pipeline     │
│ - Builds Lambda code    │
│ - Creates PR config     │
│ - Triggers Infra Pipeline│
└──────────┬──────────────┘
           │
           │ (Jenkins build job)
           ▼
┌─────────────────────────┐
│ Infrastructure Pipeline │
│ - Deploys AWS Resources │
│ - Creates Lambda        │
└──────────┬──────────────┘
           │
           ▼
    AWS Resources Created
```

---

## Troubleshooting

### Issue 1: Webhook not triggering

**Solution:**
- Verify ngrok is running and URL is correct
- Check GitHub webhook delivery logs (in GitHub → Settings → Webhooks → Recent Deliveries)
- Verify Jenkins GitHub plugin is installed
- Check Jenkins logs: **Manage Jenkins** → **System Log**

### Issue 2: "infrastructure-pipeline job not found"

**Solution:**
- Verify infrastructure pipeline job exists with exact name: `infrastructure-pipeline`
- Check job name matches exactly (case-sensitive)

### Issue 3: Infrastructure pipeline doesn't receive PR_NUMBER

**Solution:**
- Verify infrastructure pipeline has PR_NUMBER parameter configured
- Parameter name must be exactly: `PR_NUMBER` (not `pr_number` or `PrNumber`)

### Issue 4: Jenkins build job fails with permission error

**Solution:**
- Go to **Manage Jenkins** → **Configure Global Security**
- Check **Enable Job DSL** or **Enable Pipeline Build Job** (if available)
- Go to infrastructure pipeline → **Configure** → **Build Authorization**
- Make sure pipelines can trigger this job

---

## For Production

For production, you should:
1. Use a Jenkins server with a public IP/DNS (not localhost)
2. Set up SSL certificate (HTTPS)
3. Configure fixed GitHub webhook URL
4. Set up proper authentication
5. Use Jenkins credentials for GitHub token
6. Configure proper security settings

---

## Quick Reference

**Lambda App Pipeline** → Triggers → **Infrastructure Pipeline**

**Infrastructure Pipeline** → Creates → **AWS Resources**

**GitHub PR** → Webhook → **Lambda App Pipeline**

---

**You're all set! Test by creating a PR in the Lambda app repository.**

