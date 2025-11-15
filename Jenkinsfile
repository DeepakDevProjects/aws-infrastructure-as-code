/**
 * ============================================================================
 * FILE: Jenkinsfile
 * PURPOSE: Jenkins Pipeline for Infrastructure as Code Repository
 * 
 * WHAT THIS PIPELINE DOES:
 * 1. Triggers on config changes or manual trigger
 * 2. Deploys AWS infrastructure using CDK
 * 3. Creates PR-specific AWS resources (S3, Lambda, IAM, CloudWatch)
 * 4. Updates Lambda function code if provided
 * 
 * PR-SPECIFIC DEPLOYMENT:
 * - Reads PR config from config/pr-{PR_NUMBER}/config.json
 * - Deploys CloudFormation stack with PR-specific resources
 * - Outputs resource names and ARNs
 * 
 * TRIGGER:
 * - GitHub webhook on config changes
 * - Manual trigger via Jenkins UI
 * - Called from Lambda app repo pipeline (optional)
 * ============================================================================
 */

pipeline {
    agent any
    
    // Environment variables
    environment {
        // Get PR number from params, environment, or default to scanning configs
        PR_NUMBER = "${params.PR_NUMBER ?: env.PR_NUMBER ?: 'default'}"
        
        // AWS credentials (set in Jenkins Credentials Store)
        AWS_CREDENTIALS_ID = 'aws-credentials'
        
        // AWS region
        AWS_REGION = 'us-east-1'
        
        // Node version
        NODE_VERSION = '22'
        
        // AWS CLI path (for macOS with Homebrew - adjust if needed)
        PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:${env.PATH}"
    }
    
    stages {
        /**
         * ====================================================================
         * STAGE 1: CHECKOUT CODE
         * ====================================================================
         */
        stage('Checkout Infrastructure Code') {
            steps {
                script {
                    echo "============================================"
                    echo "Checking out Infrastructure repository"
                    echo "PR Number: ${PR_NUMBER}"
                    echo "============================================"
                }
                checkout scm
            }
        }
        
        /**
         * ====================================================================
         * STAGE 2: SETUP NODE.JS
         * ====================================================================
         */
        stage('Setup Node.js') {
            steps {
                script {
                    echo "============================================"
                    echo "Setting up Node.js ${NODE_VERSION}"
                    echo "============================================"
                }
                sh '''
                    # Install Node.js via nvm or use existing
                    if command -v nvm &> /dev/null; then
                        nvm install ${NODE_VERSION}
                        nvm use ${NODE_VERSION}
                    fi
                    node --version
                    npm --version
                '''
            }
        }
        
        /**
         * ====================================================================
         * STAGE 3: INSTALL DEPENDENCIES
         * ====================================================================
         */
        stage('Install Dependencies') {
            steps {
                script {
                    echo "============================================"
                    echo "Installing CDK dependencies"
                    echo "============================================"
                }
                sh '''
                    npm install
                    npm list aws-cdk-lib constructs typescript
                '''
            }
        }
        
        /**
         * ====================================================================
         * STAGE 4: READ PR CONFIG
         * ====================================================================
         * Read PR-specific configuration if it exists
         */
        stage('Read PR Configuration') {
            steps {
                script {
                    echo "============================================"
                    echo "Reading PR ${PR_NUMBER} configuration"
                    echo "============================================"
                }
                sh '''
                    CONFIG_FILE="config/pr-${PR_NUMBER}/config.json"
                    if [ -f "${CONFIG_FILE}" ]; then
                        echo "Found PR configuration:"
                        cat ${CONFIG_FILE}
                        export PR_CONFIG_EXISTS=true
                    else
                        echo "No PR-specific config found, using default deployment"
                        export PR_CONFIG_EXISTS=false
                    fi
                '''
            }
        }
        
        /**
         * ====================================================================
         * STAGE 5: BOOTSTRAP CDK (if needed)
         * ====================================================================
         * Bootstrap CDK in AWS account (only needed once)
         */
        stage('Bootstrap CDK') {
            when {
                expression { return env.PR_NUMBER == 'default' || env.BOOTSTRAP_CDK == 'true' }
            }
            steps {
                script {
                    echo "============================================"
                    echo "Bootstrapping CDK (first time only)"
                    echo "============================================"
                }
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDENTIALS_ID}"]]) {
                    sh '''
                        # Find AWS CLI
                        AWS_CLI=$(which aws 2>/dev/null || echo "/opt/homebrew/bin/aws")
                        if [ ! -f "${AWS_CLI}" ]; then
                            AWS_CLI=$(find /opt/homebrew /usr/local /usr -name aws 2>/dev/null | head -1)
                        fi
                        
                        if [ -z "${AWS_CLI}" ] || [ ! -f "${AWS_CLI}" ]; then
                            echo "ERROR: AWS CLI not found. Please install AWS CLI or update PATH in Jenkinsfile."
                            exit 1
                        fi
                        
                        # Check if already bootstrapped
                        if ! ${AWS_CLI} cloudformation describe-stacks \
                            --stack-name CDKToolkit \
                            --region ${AWS_REGION} 2>/dev/null; then
                            echo "Bootstrapping CDK..."
                            cdk bootstrap aws://$(${AWS_CLI} sts get-caller-identity --query Account --output text)/${AWS_REGION}
                        else
                            echo "CDK already bootstrapped"
                        fi
                    '''
                }
            }
        }
        
        /**
         * ====================================================================
         * STAGE 6: SYNTHESIZE CDK
         * ====================================================================
         * Generate CloudFormation template
         */
        stage('Synthesize CDK') {
            steps {
                script {
                    echo "============================================"
                    echo "Synthesizing CloudFormation template"
                    echo "============================================"
                }
                sh '''
                    cdk synth --context prNumber=${PR_NUMBER} > synth-output.yaml || {
                        echo "CDK synthesis failed"
                        exit 1
                    }
                    echo "CloudFormation template generated successfully"
                '''
            }
        }
        
        /**
         * ====================================================================
         * STAGE 7: DEPLOY INFRASTRUCTURE
         * ====================================================================
         * Deploy AWS resources using CDK
         */
        stage('Deploy Infrastructure') {
            steps {
                script {
                    echo "============================================"
                    echo "Deploying infrastructure for PR ${PR_NUMBER}"
                    echo "============================================"
                }
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDENTIALS_ID}"]]) {
                    sh '''
                        # Deploy CDK stack with PR number context
                        cdk deploy InfrastructureStack-${PR_NUMBER} \
                            --context prNumber=${PR_NUMBER} \
                            --require-approval never \
                            --outputs-file stack-outputs.json
                        
                        echo "Infrastructure deployed successfully"
                        
                        # Display stack outputs
                        if [ -f "stack-outputs.json" ]; then
                            echo "Stack Outputs:"
                            cat stack-outputs.json
                        fi
                    '''
                }
            }
        }
        
        /**
         * ====================================================================
         * STAGE 8: UPDATE LAMBDA CODE (if provided)
         * ====================================================================
         * Update Lambda function code if package exists
         */
        stage('Update Lambda Code') {
            when {
                expression {
                    return fileExists("config/pr-${PR_NUMBER}/config.json")
                }
            }
            steps {
                script {
                    echo "============================================"
                    echo "Updating Lambda function code if available"
                    echo "============================================"
                }
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDENTIALS_ID}"]]) {
                    sh '''
                        # Find AWS CLI
                        AWS_CLI=$(which aws 2>/dev/null || echo "/opt/homebrew/bin/aws")
                        if [ ! -f "${AWS_CLI}" ]; then
                            AWS_CLI=$(find /opt/homebrew /usr/local /usr -name aws 2>/dev/null | head -1)
                        fi
                        
                        if [ -z "${AWS_CLI}" ] || [ ! -f "${AWS_CLI}" ]; then
                            echo "WARNING: AWS CLI not found. Skipping Lambda code update."
                            exit 0
                        fi
                        
                        LAMBDA_PACKAGE=$(cat config/pr-${PR_NUMBER}/config.json | grep -o '"lambdaCodePackage": "[^"]*' | cut -d'"' -f4 || echo "")
                        LAMBDA_FUNCTION=$(cat config/pr-${PR_NUMBER}/config.json | grep -o '"lambdaFunctionName": "[^"]*' | cut -d'"' -f4 || echo "api-processor-lambda-pr-${PR_NUMBER}")
                        
                        if [ -n "${LAMBDA_PACKAGE}" ] && [ -f "${LAMBDA_PACKAGE}" ]; then
                            echo "Updating Lambda function ${LAMBDA_FUNCTION} with package ${LAMBDA_PACKAGE}"
                            ${AWS_CLI} lambda update-function-code \
                                --function-name ${LAMBDA_FUNCTION} \
                                --zip-file fileb://${LAMBDA_PACKAGE} \
                                --region ${AWS_REGION}
                            echo "Lambda function code updated"
                        else
                            echo "No Lambda package found, skipping code update"
                            echo "Lambda will use placeholder code from stack"
                        fi
                    '''
                }
            }
        }
        
        /**
         * ====================================================================
         * STAGE 9: VERIFY DEPLOYMENT
         * ====================================================================
         * Verify all resources are deployed correctly
         */
        stage('Verify Deployment') {
            steps {
                script {
                    echo "============================================"
                    echo "Verifying infrastructure deployment"
                    echo "============================================"
                }
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDENTIALS_ID}"]]) {
                    sh '''
                        # Find AWS CLI
                        AWS_CLI=$(which aws 2>/dev/null || echo "/opt/homebrew/bin/aws")
                        if [ ! -f "${AWS_CLI}" ]; then
                            AWS_CLI=$(find /opt/homebrew /usr/local /usr -name aws 2>/dev/null | head -1)
                        fi
                        
                        if [ -z "${AWS_CLI}" ] || [ ! -f "${AWS_CLI}" ]; then
                            echo "ERROR: AWS CLI not found. Cannot verify deployment."
                            exit 1
                        fi
                        
                        STACK_NAME="InfrastructureStack-${PR_NUMBER}"
                        
                        # Check CloudFormation stack status
                        STACK_STATUS=$(${AWS_CLI} cloudformation describe-stacks \
                            --stack-name ${STACK_NAME} \
                            --query 'Stacks[0].StackStatus' \
                            --output text \
                            --region ${AWS_REGION})
                        
                        echo "Stack Status: ${STACK_STATUS}"
                        
                        if [ "${STACK_STATUS}" = "CREATE_COMPLETE" ] || [ "${STACK_STATUS}" = "UPDATE_COMPLETE" ]; then
                            echo "✅ Infrastructure deployed successfully"
                            
                            # Get stack outputs
                            ${AWS_CLI} cloudformation describe-stacks \
                                --stack-name ${STACK_NAME} \
                                --query 'Stacks[0].Outputs' \
                                --output table \
                                --region ${AWS_REGION}
                        else
                            echo "⚠️ Stack status: ${STACK_STATUS}"
                            exit 1
                        fi
                    '''
                }
            }
        }
    }
    
    post {
        /**
         * ====================================================================
         * POST ACTIONS
         * ====================================================================
         */
        always {
            script {
                echo "============================================"
                echo "Infrastructure pipeline completed for PR ${PR_NUMBER}"
                echo "============================================"
            }
        }
        success {
            echo "✅ Infrastructure deployed successfully for PR ${PR_NUMBER}"
        }
        failure {
            echo "❌ Infrastructure deployment failed for PR ${PR_NUMBER}"
            // Optionally: Delete stack on failure to clean up partial deployment
            // sh 'cdk destroy InfrastructureStack-${PR_NUMBER} --force'
        }
    }
}

