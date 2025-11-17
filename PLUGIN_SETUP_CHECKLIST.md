# GitHub Pull Request Builder Plugin - Quick Setup Checklist

## ✅ Step-by-Step Setup

### Step 1: Install the Plugin

1. Open Jenkins: `http://localhost:8080`
2. Go to: **Manage Jenkins** → **Manage Plugins**
3. Click **Available** tab
4. Search for: `GitHub Pull Request Builder`
5. ✅ Check the box next to the plugin
6. Click **Install without restart** (or **Download now and install after restart**)
7. Wait for installation to complete
8. **Restart Jenkins** if prompted

---

### Step 2: Configure lambda-app-pipeline Job

1. Go to Jenkins Dashboard
2. Click **lambda-app-pipeline**
3. Click **Configure**
4. Scroll to **Build Triggers** section
5. ✅ Check **GitHub Pull Request Builder**
6. Configure the following settings:

   **Basic Configuration:**
   - **GitHub API URL**: `https://api.github.com` (default - leave as is)
   - **Credentials**: Select `github-token` from dropdown
     - If not visible, you need to create it first (see Step 2a below)
   
   **Build Triggers:**
   - **Admin list**: Add your GitHub username
     - Example: `DeepakDevProjects`
     - This allows PRs from you to trigger builds
   
   - **Trigger phrase**: (leave empty)
     - Empty = triggers on all PRs
     - Or set a phrase like `[test]` to trigger only when PR description contains it
   
   - ✅ **Build every pull request**: Check this
     - This ensures every PR triggers a build
   
   - **Skip build if only doc files changed**: (optional)
     - Uncheck if you want builds even for doc-only changes
   
   - **Allow members of whitelisted organizations**: (optional)
     - Check if you want to allow PRs from organization members

7. ✅ Also check **GitHub hook trigger for GITScm polling** (keep this checked)
   - This handles push events in addition to PR events

8. Click **Save**

---

### Step 2a: Verify GitHub Token Credential (If Needed)

If `github-token` is not in the dropdown:

1. Go to: **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. Check if `github-token` exists
3. If not, create it:
   - Click **Add Credentials**
   - **Kind**: Secret text
   - **Secret**: Paste your GitHub Personal Access Token
   - **ID**: `github-token`
   - **Description**: `GitHub token for PR Builder and API calls`
   - Click **Create**

---

### Step 3: Update GitHub Webhook

**IMPORTANT:** The webhook URL changes when using PR Builder plugin!

1. Make sure **ngrok is running**:
   ```bash
   ngrok http 8080
   ```
   Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

2. Go to your GitHub repository:
   - `https://github.com/DeepakDevProjects/aws-serverless-lambda-app`
   
3. Click **Settings** → **Webhooks**

4. **Edit your existing webhook** (or create new if none exists)

5. Update these settings:
   - **Payload URL**: Change to `https://YOUR_NGROK_URL.ngrok.io/ghprbhook/`
     - ⚠️ **Important:** Use `/ghprbhook/` NOT `/github-webhook/`
     - Example: `https://abc123.ngrok.io/ghprbhook/`
   
   - **Content type**: `application/json`
   
   - **Events**: Select **Let me select individual events**
     - ✅ Check **Pull requests** (required!)
     - ✅ Check **Pushes** (optional - for push events)
   
   - ✅ **Active**: Checked

6. Click **Update webhook** (or **Add webhook**)

---

### Step 4: Test the Setup

1. **Create a test PR:**
   - Make a small change in your repo
   - Create a Pull Request (any branch name works!)
   - Example: Create PR from branch `feature/hello-feature`

2. **Check Jenkins:**
   - Go to Jenkins Dashboard
   - You should see `lambda-app-pipeline` automatically triggered
   - Click on the build number

3. **Verify PR Number Detection:**
   - Open the **Console Output**
   - Look for: `✅ Detected PR number from ghprbPullId (webhook): <PR_NUMBER>`
   - The PR number should be the actual GitHub PR number (not "default")

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Plugin is installed (Manage Jenkins → Manage Plugins → Installed)
- [ ] `lambda-app-pipeline` has "GitHub Pull Request Builder" checked
- [ ] GitHub token credential is selected in PR Builder config
- [ ] Admin list contains your GitHub username
- [ ] "Build every pull request" is checked
- [ ] GitHub webhook URL uses `/ghprbhook/` endpoint
- [ ] Webhook events include "Pull requests"
- [ ] Test PR triggers Jenkins automatically
- [ ] Console output shows PR number from `ghprbPullId`

---

## 🔧 Troubleshooting

### Issue: Webhook not triggering

**Solutions:**
- Verify ngrok is running and URL is correct
- Check webhook URL uses `/ghprbhook/` (not `/github-webhook/`)
- Verify "Pull requests" event is selected in webhook
- Check GitHub webhook delivery logs (Settings → Webhooks → Recent Deliveries)
- Check Jenkins logs: **Manage Jenkins** → **System Log**

### Issue: PR number still shows "default"

**Solutions:**
- Verify PR Builder plugin is installed and enabled
- Check webhook URL is correct (`/ghprbhook/`)
- Verify webhook is receiving PR events (check GitHub webhook delivery logs)
- Check Jenkins console output for `ghprbPullId` detection message

### Issue: "Credentials not found"

**Solutions:**
- Verify `github-token` credential exists in Jenkins
- Check credential ID matches exactly: `github-token`
- Verify token has `repo` scope in GitHub

---

## 📝 Notes

- **Webhook URL Difference:**
  - Standard hook: `/github-webhook/`
  - PR Builder: `/ghprbhook/`

- **Both can work together:**
  - PR Builder handles PR events
  - Standard hook handles push events
  - Keep both checked if you want both triggers

- **PR Number Priority (in Jenkinsfile):**
  1. `ghprbPullId` (from PR Builder plugin) ✅
  2. `CHANGE_ID` (from webhook)
  3. GitHub API call (fallback)
  4. Branch name extraction (fallback)

---

## 🎉 Success!

Once configured, every PR will automatically:
- Trigger the `lambda-app-pipeline`
- Set `ghprbPullId` with the real PR number
- Deploy PR-specific infrastructure
- Deploy Lambda function code

No more "default" PR numbers! 🚀

