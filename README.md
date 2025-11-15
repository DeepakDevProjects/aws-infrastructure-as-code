# AWS Infrastructure as Code

AWS CDK (TypeScript) infrastructure for Lambda function deployment.

## Overview

Creates AWS resources:
- **S3 Bucket**: For storing API responses
- **Lambda Function**: Node.js 22.x runtime
- **IAM Role**: For Lambda execution with S3 write permissions
- **CloudWatch Logs**: For Lambda logging

## Project Structure

```
aws-infrastructure-as-code/
├── bin/
│   └── app.ts              # CDK app entry point
├── lib/
│   └── stack.ts            # Stack definition
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── cdk.json                # CDK configuration
└── README.md
```

## Prerequisites

- Node.js 22.x or higher
- AWS CLI configured with credentials
- AWS CDK CLI: `npm install -g aws-cdk`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

## Usage

### Synthesize CloudFormation template:
```bash
npm run synth
```

### Deploy with PR number:
```bash
cdk deploy --context prNumber=123 InfrastructureStack-123
```

### Deploy default:
```bash
npm run deploy
```

### Diff changes:
```bash
npm run diff
```

## PR-Specific Deployment

This stack supports PR-specific deployments:
- Resources are named with PR number: `pr-{PR_NUMBER}`
- Each PR gets isolated resources
- Resources can be easily cleaned up

## Resources Created

- S3 Bucket: `api-responses-bucket-pr-{PR_NUMBER}-{ACCOUNT_ID}`
- Lambda Function: `api-processor-lambda-pr-{PR_NUMBER}`
- IAM Role with S3 write permissions
- CloudWatch Log Group for Lambda logs

