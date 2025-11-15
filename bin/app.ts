#!/usr/bin/env node
/**
 * ============================================================================
 * FILE: bin/app.ts
 * PURPOSE: Entry point for AWS CDK application
 * 
 * WHAT THIS FILE DOES:
 * 1. This is where CDK starts when you run 'cdk deploy' or 'cdk synth'
 * 2. Creates a CDK App (the root container for all your infrastructure)
 * 3. Instantiates your InfrastructureStack (defines all AWS resources)
 * 
 * FILE STRUCTURE:
 * - bin/app.ts: Entry point (this file) - Creates app and stack
 * - lib/stack.ts: Defines actual AWS resources (S3, Lambda, IAM, etc.)
 * 
 * FLOW:
 * 1. You run: cdk deploy
 * 2. CDK reads: bin/app.ts (this file)
 * 3. This file imports and creates: InfrastructureStack (from lib/stack.ts)
 * 4. CDK synthesizes to CloudFormation
 * 5. CloudFormation deploys to AWS
 * ============================================================================
 */

/**
 * #!/usr/bin/env node
 * This tells the system to run this file with Node.js
 * Makes the file executable: ./bin/app.ts (though we run via CDK CLI)
 */

/**
 * source-map-support: Helps with debugging TypeScript code
 * Maps compiled JavaScript errors back to original TypeScript lines
 */
import 'source-map-support/register';

/**
 * Import CDK core library
 * Contains App, Stack, and other core CDK classes
 */
import * as cdk from 'aws-cdk-lib';

/**
 * Import our custom InfrastructureStack class
 * This is defined in lib/stack.ts and contains all AWS resource definitions
 */
import { InfrastructureStack } from '../lib/stack';

/**
 * ============================================================================
 * CREATE CDK APP
 * ============================================================================
 * 
 * App is the root container for all your infrastructure
 * - Think of it as the "workspace" or "project"
 * - Can contain multiple Stacks (groups of resources)
 * - One App can deploy multiple Stacks
 */
const app = new cdk.App();

/**
 * ============================================================================
 * GET PR NUMBER FROM CONTEXT
 * ============================================================================
 * 
 * Context: Values passed when running CDK commands
 * 
 * Example: cdk deploy --context prNumber=123
 * 
 * This allows us to:
 * - Create PR-specific resources: pr-123, pr-456, etc.
 * - Deploy the same code for different PRs
 * - Isolate resources per PR
 * 
 * If no PR number provided, use 'default'
 */
const prNumber = app.node.tryGetContext('prNumber') || 'default';

/**
 * ============================================================================
 * CREATE INFRASTRUCTURE STACK
 * ============================================================================
 * 
 * Stack: A group of AWS resources that are deployed together
 * 
 * InfrastructureStack is defined in lib/stack.ts and contains:
 * - S3 Bucket
 * - Lambda Function
 * - IAM Roles
 * - CloudWatch Logs
 * 
 * Parameters:
 * - app: Parent CDK App
 * - `InfrastructureStack-${prNumber}`: Stack name (unique identifier)
 * - { prNumber, env }: Stack properties
 *   - prNumber: Used for resource naming
 *   - env: AWS account and region to deploy to
 */
new InfrastructureStack(app, `InfrastructureStack-${prNumber}`, {
  prNumber: prNumber, // Pass PR number to stack (used for naming resources)
  env: {
    // AWS Account ID (auto-detected from AWS credentials)
    account: process.env.CDK_DEFAULT_ACCOUNT,
    // AWS Region (default: us-east-1)
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

