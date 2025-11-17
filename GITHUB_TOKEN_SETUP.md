# GitHub Token Setup for Jenkins

## Where the Token is Used

The Jenkinsfile uses the GitHub token at **line 48**:
```groovy
GITHUB_TOKEN_CREDENTIALS_ID = 'github-token'
```

This token is used to:
- Query GitHub API to find PR numbers for branches
- Access the infrastructure repository

---

## Step-by-Step: Add GitHub Token to Jenkins

### Step 1: Create GitHub Personal Access Token

1. Go to GitHub: https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Give it a name: `Jenkins CI/CD Token`
4. Select scopes:
   - ✅ **repo** (Full control of private repositories)
     - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`
5. Click **Generate token**
6. **Copy the token immediately** (starts with `ghp_`)
   - ⚠️ You won't be able to see it again!

---

### Step 2: Add Token to Jenkins Credentials

1. Open Jenkins: `http://localhost:8080`
2. Go to: **Manage Jenkins** → **Credentials**
3. Click **System** → **Global credentials (unrestricted)**
4. Click **Add Credentials** (on the left sidebar)
5. Fill in the form:
   - **Kind**: Select **Secret text**
   - **Secret**: Paste your GitHub token (the `ghp_...` token you copied)
   - **ID**: Enter exactly: `github-token`
     - ⚠️ **Important:** This must match exactly what's in the Jenkinsfile!
   - **Description**: `GitHub token for PR detection and API calls`
6. Click **Create**

---

### Step 3: Verify Token is Added

1. Go back to: **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. You should see `github-token` in the list
3. The ID should be exactly: `github-token`

---

## ✅ Verification

Test that the token works:

1. Run the `lambda-app-pipeline` job
2. Check the console output
3. Look for: `✅ Found PR number from GitHub API: <PR_NUMBER>`
4. If you see errors about authentication, the token might be invalid or missing

---

## 🔧 Troubleshooting

### Error: "Credentials not found"

**Solution:**
- Verify the credential ID is exactly `github-token` (case-sensitive)
- Check it's in **System** → **Global credentials**
- Make sure you're using **Secret text** (not Username/Password)

### Error: "Bad credentials" or "401 Unauthorized"

**Solutions:**
- Verify the token is correct (copy it again from GitHub)
- Check the token hasn't expired
- Verify the token has `repo` scope
- Regenerate the token if needed

### Error: "No open PR found"

**Solutions:**
- Make sure a PR exists for the branch
- Verify the PR is **open** (not closed/merged)
- Check the branch name matches exactly

---

## 📝 Token Requirements

The token must have:
- ✅ **repo** scope (to read PRs and access repositories)

Optional but recommended:
- ✅ **read:org** (if using organization repositories)

---

## 🔒 Security Notes

- Never commit the token to git
- Store it only in Jenkins Credentials
- Use different tokens for different environments
- Rotate tokens periodically
- Revoke tokens if compromised

---

## 🎯 Quick Reference

**Jenkinsfile Location:** Line 48
```groovy
GITHUB_TOKEN_CREDENTIALS_ID = 'github-token'
```

**Jenkins Credential Path:**
- **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
- **ID:** `github-token`
- **Type:** Secret text

**GitHub Token Creation:**
- https://github.com/settings/tokens
- Scope: `repo`

