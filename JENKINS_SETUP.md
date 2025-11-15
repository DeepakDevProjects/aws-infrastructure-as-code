# Jenkins Setup Guide

## Overview

This guide explains how to set up Jenkins locally to run the CI/CD pipelines for both repositories.

## Prerequisites

1. **Java 11 or higher** - Required for Jenkins
2. **Node.js 22.x** - For CDK and Lambda builds
3. **AWS CLI** - For AWS operations
4. **Git** - For repository access
5. **AWS Account** - With credentials configured

## Jenkins Installation (Local - macOS)

### Option 1: Using Docker (Recommended)

```bash
# Install Docker Desktop for Mac

# Run Jenkins container
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts

# Access Jenkins at http://localhost:8080
# Get initial admin password:
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### Option 2: Using Homebrew

```bash
# Install Jenkins
brew install jenkins-lts

# Start Jenkins
brew services start jenkins-lts

# Access Jenkins at http://localhost:8080
# Initial password location: ~/.jenkins/secrets/initialAdminPassword
```

### Option 3: Using Java WAR File

```bash
# Download Jenkins WAR file
wget https://get.jenkins.io/war-stable/latest/jenkins.war

# Run Jenkins
java -jar jenkins.war

# Access Jenkins at http://localhost:8080
```

## Jenkins Initial Setup

1. **Access Jenkins**
   - Open browser: http://localhost:8080
   - Enter initial admin password

2. **Install Suggested Plugins**
   - Pipeline
   - AWS Steps
   - GitHub
   - Credentials Binding
   - NodeJS Plugin

3. **Create Admin User**
   - Set up your admin account

## Required Jenkins Plugins

Install these plugins via Jenkins Plugin Manager:

1. **Pipeline** - For Jenkinsfile support
2. **AWS Steps** - For AWS operations
3. **GitHub Plugin** - For GitHub integration
4. **Credentials Binding Plugin** - For managing secrets
5. **NodeJS Plugin** - For Node.js builds
6. **Git Plugin** - For Git operations

## Configure Jenkins Credentials

### 1. AWS Credentials

1. Go to: **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. Click **Add Credentials**
3. Select **AWS Credentials**
4. Configure:
   - **Kind**: AWS Credentials
   - **ID**: `aws-credentials`
   - **Access Key ID**: Your AWS Access Key
   - **Secret Access Key**: Your AWS Secret Key
   - **Description**: AWS credentials for deployments

### 2. GitHub Token

1. Go to: **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. Click **Add Credentials**
3. Select **Secret text**
4. Configure:
   - **Kind**: Secret text
   - **ID**: `github-token`
   - **Secret**: Your GitHub Personal Access Token
   - **Description**: GitHub token for repo access

   **How to create GitHub Personal Access Token:**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` permissions

### 3. Configure Node.js

1. Go to: **Manage Jenkins** → **Global Tool Configuration**
2. Find **NodeJS** section
3. Add Node.js installation:
   - **Name**: `NodeJS-22`
   - **Version**: 22.x (or latest LTS)
   - ✅ Install automatically

## Create Jenkins Jobs

### Job 1: Lambda App Pipeline

1. Go to: **Dashboard** → **New Item**
2. Enter name: `lambda-app-pipeline`
3. Select: **Pipeline**
4. Click **OK**
5. Configure:
   - **Description**: Pipeline for Lambda app repository
   - **Pipeline** → **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/DeepakDevProjects/aws-serverless-lambda-app.git`
   - **Credentials**: (if private repo)
   - **Branches to build**: `*/main` or `*/pr/*`
   - **Script Path**: `Jenkinsfile`
6. Click **Save**

### Job 2: Infrastructure Pipeline

1. Go to: **Dashboard** → **New Item**
2. Enter name: `infrastructure-pipeline`
3. Select: **Pipeline**
4. Click **OK**
5. Configure:
   - **Description**: Pipeline for infrastructure deployment
   - **Pipeline** → **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/DeepakDevProjects/aws-infrastructure-as-code.git`
   - **Branches to build**: `*/main`
   - **Script Path**: `Jenkinsfile`
6. Click **Save**

## GitHub Webhook Setup (Optional)

To trigger Jenkins automatically on PR creation:

1. **Configure Jenkins**
   - Go to **Manage Jenkins** → **Configure System**
   - Find **GitHub** section
   - Add GitHub server
   - Configure credentials (GitHub token)

2. **Configure Repository Webhooks**
   - GitHub repository → Settings → Webhooks
   - Add webhook:
     - **Payload URL**: `http://your-jenkins-url:8080/github-webhook/`
     - **Content type**: `application/json`
     - **Events**: Pull requests
     - ✅ Active

## Testing the Pipeline

### Manual Trigger

1. Go to Jenkins Dashboard
2. Select your pipeline job
3. Click **Build with Parameters**
4. Enter PR number (or use default)
5. Click **Build**

### Via GitHub PR

1. Create a Pull Request in the repository
2. Jenkins should automatically trigger (if webhook configured)
3. Or manually trigger the job with PR number

## Troubleshooting

### Common Issues

1. **AWS Credentials Not Found**
   - Verify credentials ID is `aws-credentials`
   - Check credentials are configured correctly

2. **CDK Bootstrap Error**
   - Run `cdk bootstrap` manually first
   - Or enable bootstrap stage in Jenkinsfile

3. **GitHub Authentication Failed**
   - Verify GitHub token has correct permissions
   - Check token is not expired

4. **Node.js Not Found**
   - Install Node.js plugin
   - Configure Node.js in Global Tool Configuration

5. **Pipeline Fails on PR Config Creation**
   - Ensure GitHub token has write permissions
   - Check repository URL is correct

## Next Steps

1. Install Jenkins locally
2. Configure credentials
3. Create pipeline jobs
4. Test with a sample PR
5. Review pipeline logs
6. Iterate and improve

