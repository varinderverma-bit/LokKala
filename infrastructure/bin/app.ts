#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ArtMarketplaceStack } from '../lib/art-marketplace-stack';

const app = new cdk.App();
new ArtMarketplaceStack(app, 'ArtMarketplaceStack', {
  env: {
    account: '022706514418',
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Art Marketplace: EC2, ALB, API Gateway, CloudFront, S3, DynamoDB, Redis',
});
