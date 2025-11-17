/**
 * ============================================================================
 * FILE: lib/stack.ts
 * PURPOSE: Defines all AWS infrastructure resources
 * 
 * WHAT THIS FILE DOES:
 * 1. Defines a CDK Stack class (group of AWS resources)
 * 2. Creates S3 bucket for storing API responses
 * 3. Creates Lambda function with Node.js 22.x runtime
 * 4. Creates IAM role with necessary permissions
 * 5. Creates CloudWatch Log Group for Lambda logs
 * 6. Connects everything together (Lambda can write to S3, etc.)
 * 
 * KEY CONCEPTS:
 * - Stack: Group of related AWS resources
 * - Construct: A reusable component (S3 bucket, Lambda function, etc.)
 * - Props: Configuration passed to Stack (like PR number)
 * 
 * HOW IT WORKS:
 * When you run 'cdk deploy', CDK reads this file and:
 * 1. Synthesizes to CloudFormation template
 * 2. Deploys CloudFormation to AWS
 * 3. AWS creates the actual resources (S3 bucket, Lambda, etc.)
 * ============================================================================
 */

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface InfrastructureStackProps extends cdk.StackProps {
  prNumber: string;
}

export class InfrastructureStack extends cdk.Stack {
  public readonly s3Bucket: s3.Bucket;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const { prNumber } = props;

    // S3 Bucket for storing API responses
    // ⚠️ WARNING: DESTROY policy means bucket and ALL files are deleted when stack is deleted
    // For production, use RETAIN to keep data
    this.s3Bucket = new s3.Bucket(this, `ApiResponsesBucket-${prNumber}`, {
      bucketName: `api-responses-bucket-pr-${prNumber}-${this.account}`.toLowerCase(),
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // CloudWatch Log Group for Lambda logs (stores console.log output)
    const logGroup = new logs.LogGroup(this, `LambdaLogGroup-${prNumber}`, {
      logGroupName: `/aws/lambda/api-processor-lambda-pr-${prNumber}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Lambda function (defines what AWS services Lambda can access)
    const lambdaRole = new iam.Role(this, `LambdaRole-${prNumber}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Role for Lambda function in PR ${prNumber}`,
    });

    // Grant Lambda permission to write to S3 bucket (only this specific bucket)
    this.s3Bucket.grantWrite(lambdaRole);

    // Grant Lambda permission to write CloudWatch Logs
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [logGroup.logGroupArn],
      })
    );

    // Lambda Function - ⚠️ PLACEHOLDER CODE: Will be replaced with actual code from lambda-app repo
    // In production, use code.fromAsset('path/to/lambda-code.zip') instead of fromInline
    // Handler path: src/index.handler (because Lambda code is in src/index.js)
    this.lambdaFunction = new lambda.Function(this, `ApiProcessorLambda-${prNumber}`, {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'src/index.handler',
      functionName: `api-processor-lambda-pr-${prNumber}`,
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Lambda placeholder - update with actual code from lambda-app repo');
          return { statusCode: 200, body: 'Placeholder' };
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        S3_BUCKET_NAME: this.s3Bucket.bucketName,
        API_URL: 'https://jsonplaceholder.typicode.com/posts/1',
      },
      logGroup: logGroup,
    });

    // CloudFormation Outputs - visible in AWS Console and CLI after deployment
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.s3Bucket.bucketName,
      description: 'S3 Bucket name for storing API responses',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'Lambda Function ARN (Amazon Resource Name)',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Lambda Function Name',
    });
  }
}

