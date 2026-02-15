#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ArtMarketplaceStack } from '../lib/art-marketplace-stack';
import { getEnvConfig, getStageFromContext } from '../lib/env-config';

const app = new cdk.App();

const stage = getStageFromContext({
  stage: app.node.tryGetContext('stage'),
  region: app.node.tryGetContext('region'),
  account: app.node.tryGetContext('account'),
});
const region = (app.node.tryGetContext('region') as string) || process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';
const account = (app.node.tryGetContext('account') as string) || process.env.CDK_DEFAULT_ACCOUNT || '022706514418';

const envConfig = getEnvConfig(stage, region, account);

new ArtMarketplaceStack(app, `ArtMarketplaceStack-${stage}`, {
  env: {
    account: envConfig.account,
    region: envConfig.region,
  },
  envConfig,
  description: `Art Marketplace (${stage}) – ${region}: EC2, ALB, API Gateway, CloudFront, S3, DynamoDB, Redis, RDS, CQRS`,
  tags: {
    Environment: stage,
    Stage: stage,
    Region: envConfig.region,
    Project: 'ArtMarketplace',
  },
});
