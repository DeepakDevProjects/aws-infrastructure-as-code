# Step-by-Step Jenkins Configuration Guide

Follow these steps in order to configure Jenkins for your CI/CD pipelines.

## Step 1: Access Jenkins Dashboard

1. Open your browser
2. Go to: **http://localhost:8080**
3. You should see the Jenkins dashboard

---

## Step 2: Install Required Plugins

1. Click **Manage Jenkins** (left sidebar)
2. Click **Plugins** (under "System Configuration")
3. Go to **Available** tab
4. Search and install these plugins (one by one or select multiple):
   - **Pipeline** (should be installed by default)
   - **AWS Steps Plugin**
   - **GitHub Plugin**
   - **Credentials Binding Plugin**
   - **NodeJS Plugin**
   - **Git Plugin**

5. For each plugin:
   - Check the box next to it
   - Click **Install without restart** (or **Download now and install after restart**)
   
6. Wait for installation to complete
7. If prompted, click **Restart Jenkins when installation is complete**

---

## Step 3: Configure Node.js Tool

1. Go to: **Manage Jenkins** → **Tools** (under "Global Tool Configuration")
2. Scroll down to **NodeJS** section
3. Click **Add NodeJS**
4. Configure:
   - **Name**: `NodeJS-22` (or any name you prefer)
   - **Version**: Select **22.x** or latest LTS version
   - ✅ Check **Install automatically**
   - Click **Save**

**Note:** If you already have Node.js installed, you can also specify the path directly.

---

## Step 4: Configure AWS Credentials

1. Go to: **Manage Jenkins** → **Credentials**
2. Click on **System** (under "Stores scoped to Jenkins")
3. Click **Global credentials (unrestricted)**
4. Click **Add Credentials** (left sidebar)

5. Configure AWS Credentials:
   - **Kind**: Select **AWS Credentials**
   - **Scope**: Global
   - **ID**: `aws-credentials` (MUST be exactly this - Jenkinsfiles use this ID)
   - **Description**: `AWS credentials for deployments` (optional)
   - **Access Key ID**: Enter your AWS Access Key ID
   - **Secret Access Key**: Enter your AWS Secret Access Key
   - Click **OK**

**How to get AWS credentials:**
- Go to AWS Console → IAM → Users → Your user → Security credentials
- Create Access Key if you don't have one
- Download and save the credentials securely

---

## Step 5: Configure GitHub Token

1. Still in **Credentials** → **System** → **Global credentials**
2. Click **Add Credentials** again

3. Configure GitHub Token:
   - **Kind**: Select **Secret text**
   - **Scope**: Global
   - **ID**: `github-token` (MUST be exactly this)
   - **Description**: `GitHub Personal Access Token` (optional)
   - **Secret**: Enter your GitHub Personal Access Token
   - Click **OK**

**How to create GitHub Personal Access Token:**
1. Go to GitHub.com → Your Profile (top right) → **Settings**
2. Scroll down → **Developer settings** (left sidebar)
3. Click **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token** → **Generate new token (classic)**
5. Configure:
   - **Note**: `Jenkins CI/CD` (any name)
   - **Expiration**: Set your preference (90 days, 1 year, etc.)
   - **Scopes**: Check **repo** (this gives full repository access)
6. Click **Generate token**
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again)
8. Paste it in Jenkins credentials above

---

## Step 6: Verify AWS CLI is Available

1. Open a terminal on your Mac
2. Run: `which aws`
   - If it shows a path: Good, AWS CLI is installed
   - If not: Install AWS CLI using `brew install awscli`

3. Run: `aws --version` to verify

4. Run: `aws configure` to configure AWS CLI:
   - Enter your AWS Access Key ID
   - Enter your AWS Secret Access Key
   - Enter default region: `us-east-1` (or your preferred region)
   - Enter default output format: `json`

**Note:** Jenkins will use the credentials from Step 4, but having AWS CLI configured helps with troubleshooting.

---

## Step 7: Create Lambda App Pipeline Job

1. Go to Jenkins Dashboard (click **Jenkins** in top left)
2. Click **New Item** (left sidebar)

3. Configure the job:
   - **Item name**: `lambda-app-pipeline` (or any name you prefer)
   - Select **Pipeline** (not "Freestyle project")
   - Click **OK**

4. Configure the pipeline:
   - **Description**: `Pipeline for Lambda App Repository - Builds, tests, and deploys Lambda function`
   
   - Scroll down to **Pipeline** section:
     - **Definition**: Select **Pipeline script from SCM**
     - **SCM**: Select **Git**
   
   - **Repository URL**: 
     ```
     https://github.com/DeepakDevProjects/aws-serverless-lambda-app.git
     ```
     (Replace with your actual repository URL if different)
   
   - **Credentials**: 
     - If repository is private, select your GitHub credentials
     - If public, leave blank
   
   - **Branches to build**: 
     - You'll see a field with "Branch Specifier" or "Branches to build"
     - Click **Add** button (to add a branch pattern)
     - Enter: `*/main` (this builds from main branch)
     - **OR** if you want to build from any branch, enter: `*`
     - **IMPORTANT:** You only need ONE branch entry for now
     - If you see multiple "Add" buttons, just click once and enter `*/main`
   
   - **Repository browser**: 
     - Select **Auto** (default option)
     - OR leave it as **Auto** (this is fine for most cases)
     - This is optional and can be left as default
   
   - **Script Path**: 
     - Should show `Jenkinsfile` by default
     - If blank, enter: `Jenkinsfile`
     - This tells Jenkins to use the Jenkinsfile in your repo root
   
   - **Additional Behaviours** (Optional - you can skip this):
     - This section is optional, you don't need to configure it
     - If you want to organize, click **Add** → **Checkout to a sub-directory**
       - **Local subdirectory for repo**: `lambda-app` (optional)
   
5. Click **Save**

---

## Step 8: Create Infrastructure Pipeline Job

1. Go to Jenkins Dashboard
2. Click **New Item**

3. Configure the job:
   - **Item name**: `infrastructure-pipeline` (or any name you prefer)
   - Select **Pipeline**
   - Click **OK**

4. Configure the pipeline:
   - **Description**: `Pipeline for Infrastructure as Code - Deploys AWS resources using CDK`
   
   - **Pipeline** section:
     - **Definition**: **Pipeline script from SCM**
     - **SCM**: **Git**
   
   - **Repository URL**: 
     ```
     https://github.com/DeepakDevProjects/aws-infrastructure-as-code.git
     ```
   
   - **Credentials**: Same as above (GitHub credentials if private)
   
   - **Branches to build**: `*/main`
   
   - **Script Path**: `Jenkinsfile`

5. Click **Save**

---

## Step 9: Test Lambda App Pipeline (Manual)

1. Go to Jenkins Dashboard
2. Click on **lambda-app-pipeline**
3. Click **Build with Parameters** (if you set up parameters) or **Build Now**

4. If you see **Build with Parameters**:
   - **PR_NUMBER**: Enter `123` (or any test PR number)
   - Click **Build**

5. Watch the build progress:
   - Click on the build number (#1) in **Build History**
   - Click **Console Output** to see real-time logs

6. **Expected Results:**
   - ✅ Stage 1: Checkout succeeds
   - ✅ Stage 2: Dependencies install
   - ✅ Stage 3: Tests run
   - ✅ Stage 4: Lambda code packaged
   - ⚠️ Stage 5: May fail if GitHub token doesn't have write access (this is OK for now)
   - ⚠️ Stage 6-8: May fail if infrastructure isn't deployed yet (this is OK)

**Note:** First run might fail at later stages - that's expected. We'll fix issues step by step.

---

## Step 10: Configure Pipeline Parameters (Optional but Recommended)

### For Lambda App Pipeline:

1. Go to **lambda-app-pipeline** → **Configure**
2. Check **This project is parameterized**
3. Click **Add Parameter** → **String Parameter**
4. Configure:
   - **Name**: `PR_NUMBER`
   - **Default Value**: `default`
   - **Description**: `PR Number for deployment (e.g., 123)`
5. Click **Save**

### For Infrastructure Pipeline:

1. Go to **infrastructure-pipeline** → **Configure**
2. Check **This project is parameterized**
3. Click **Add Parameter** → **String Parameter**
4. Configure:
   - **Name**: `PR_NUMBER`
   - **Default Value**: `default`
   - **Description**: `PR Number for deployment (e.g., 123)`
5. Click **Save**

---

## Step 11: Test Infrastructure Pipeline (Manual)

**IMPORTANT:** Before running infrastructure pipeline, you need to bootstrap CDK in your AWS account.

### Bootstrap CDK (One-time setup):

1. Open terminal
2. Navigate to your infrastructure repo:
   ```bash
   cd /Users/deepakkumar/aws-infrastructure-as-code
   ```
3. Run:
   ```bash
   npm install
   cdk bootstrap
   ```
4. Wait for bootstrap to complete (creates CDK assets bucket in AWS)

### Now test the pipeline:

1. Go to Jenkins Dashboard
2. Click **infrastructure-pipeline**
3. Click **Build with Parameters**
4. Enter **PR_NUMBER**: `default` (or test number)
5. Click **Build**

6. Watch the build:
   - First time will take longer (installing dependencies)
   - Should deploy AWS resources successfully
   - Check **Console Output** for details

7. **Verify in AWS Console:**
   - Go to AWS Console → CloudFormation
   - Look for stack: `InfrastructureStack-default`
   - Go to S3 → Look for bucket: `api-responses-bucket-pr-default-*`
   - Go to Lambda → Look for function: `api-processor-lambda-pr-default`

---

## Step 12: Set Up GitHub Webhooks (Optional - For Automatic Triggers)

### Configure Jenkins to Accept Webhooks:

1. Go to: **Manage Jenkins** → **Configure System**
2. Scroll to **GitHub** section
3. Click **Add GitHub Server**
4. Configure:
   - **Name**: `GitHub` (or any name)
   - **API URL**: `https://api.github.com` (default)
   - **Credentials**: Click **Add** → **Jenkins**
     - **Kind**: Secret text
     - **Secret**: Paste your GitHub token
     - **ID**: `github-webhook-token`
     - Click **Add**
   - Select the credentials you just created
   - ✅ Check **Manage hooks**
5. Click **Save**

### Configure GitHub Repository Webhooks:

1. Go to your GitHub repository (Lambda app repo)
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `http://localhost:8080/github-webhook/`
     - **Note:** If Jenkins is not accessible from internet, webhooks won't work
     - For local testing, you'll need to use ngrok or manually trigger
   - **Content type**: `application/json`
   - **Events**: Select **Let me select individual events**
     - ✅ Check **Pull requests**
     - ✅ Check **Pushes** (optional)
   - ✅ Active
   - Click **Add webhook**

4. Repeat for infrastructure repo if needed

**Note:** For local Jenkins, webhooks from GitHub won't work because localhost isn't accessible from internet. You'll need to:
- Use ngrok to expose Jenkins (tutorial: https://ngrok.com/)
- Or manually trigger pipelines when PRs are created

---

## Step 13: Verify Everything Works

### Test Complete Workflow:

1. **Create a test PR in Lambda app repo:**
   - Make a small change in the repo
   - Create a PR with number (e.g., PR #1)
   
2. **In Jenkins, run Lambda app pipeline:**
   - Go to **lambda-app-pipeline**
   - Click **Build with Parameters**
   - **PR_NUMBER**: `1` (or your PR number)
   - Click **Build**

3. **Then run Infrastructure pipeline:**
   - Go to **infrastructure-pipeline**
   - Click **Build with Parameters**
   - **PR_NUMBER**: `1`
   - Click **Build**

4. **Verify in AWS:**
   - Check CloudFormation stack: `InfrastructureStack-1`
   - Check S3 bucket: `api-responses-bucket-pr-1-*`
   - Check Lambda: `api-processor-lambda-pr-1`

---

## Troubleshooting Common Issues

### Issue 1: "Credentials not found"

**Solution:**
- Verify credential IDs are exactly:
  - `aws-credentials` (not `aws-credentials-1` or anything else)
  - `github-token` (not `github-token-1`)

### Issue 2: "AWS CLI not found"

**Solution:**
- Install AWS CLI: `brew install awscli`
- Or make sure PATH in Jenkins includes AWS CLI location

### Issue 3: "Node.js not found"

**Solution:**
- Go to **Manage Jenkins** → **Tools**
- Verify Node.js is configured
- Check Node.js version matches

### Issue 4: "CDK not found"

**Solution:**
- CDK is installed via `npm install` in the pipeline
- If it fails, check Node.js is configured correctly

### Issue 5: "GitHub authentication failed"

**Solution:**
- Verify GitHub token has `repo` scope
- Check token hasn't expired
- Verify token is correct in Jenkins credentials

### Issue 6: "S3 bucket already exists"

**Solution:**
- Change PR number
- Or delete existing bucket manually in AWS Console

### Issue 7: "CloudFormation stack creation failed"

**Solution:**
- Check AWS Console → CloudFormation → Events tab
- Look for error messages
- Common issues:
  - Bucket name already taken (change PR number)
  - IAM permissions insufficient (check IAM user permissions)
  - Region not supported (check CDK region setting)

---

## Quick Reference: Running Pipelines

### Manual Trigger:
1. Jenkins Dashboard → Select pipeline → **Build with Parameters**
2. Enter PR_NUMBER
3. Click **Build**

### Check Build Status:
1. Click on pipeline job
2. Click on build number (#1, #2, etc.)
3. Click **Console Output** to see logs

### View Build History:
- Left sidebar → **Build History** shows all builds
- Color indicators:
  - 🔵 Blue = Success
  - 🔴 Red = Failed
  - 🟡 Yellow = Unstable/Warning

---

## Next Steps After Configuration

1. ✅ Test both pipelines manually
2. ✅ Verify AWS resources are created
3. ✅ Test Lambda function manually in AWS Console
4. ✅ Create a real PR and test end-to-end
5. ✅ Set up cleanup jobs (optional - delete resources after PR merge)

---

## Summary Checklist

- [ ] Jenkins installed and running
- [ ] Required plugins installed
- [ ] Node.js tool configured
- [ ] AWS credentials configured (`aws-credentials`)
- [ ] GitHub token configured (`github-token`)
- [ ] Lambda app pipeline job created
- [ ] Infrastructure pipeline job created
- [ ] CDK bootstrapped in AWS
- [ ] Both pipelines tested manually
- [ ] AWS resources verified in Console

---

**You're all set! Start with Step 1 and work through each step sequentially. Let me know if you encounter any issues!**

