# Art Marketplace – AWS CDK Infrastructure

This CDK app provisions the full backend for the Art Marketplace:

- **EC2** – Hosts the app (Vite/React build served by nginx).
- **ALB** – Application Load Balancer in front of EC2.
- **API Gateway** – HTTP API with VPC Link to the ALB (API traffic: Client → API Gateway → ALB → EC2).
- **CloudFront** – CDN; default origin = ALB (app), `/paintings/*` = S3 (object storage).
- **S3** – Object storage for painting images.
- **DynamoDB** – Table for paintings metadata (e.g. id, regionId, attributes).
- **ElastiCache Redis** – Cache for lower latency.

## Prerequisites

- Node.js 18+
- AWS CLI configured (`aws configure`)
- Bootstrapped CDK in the account/region:  
  `cdk bootstrap`

## Install and synth

```bash
cd infrastructure
npm install
npm run build
npx cdk synth
```

## Deploy

```bash
npx cdk deploy
```

After deploy, stack outputs include:

- **AppUrl** – CloudFront URL (main app + CDN).
- **ApiUrl** – API Gateway URL (for API calls).
- **PaintingsBucketName** – S3 bucket for painting images.
- **PaintingsTableName** – DynamoDB table name.
- **RedisEndpoint** – ElastiCache Redis endpoint (e.g. for cache client on EC2).
- **InstanceId** – EC2 instance ID (for SSM Session Manager or SSH if configured).

## Deploying the app to EC2

1. Build the frontend: from repo root, `npm run build`.
2. Copy `dist/` to the EC2 instance (e.g. via SSM, SCP, or a pipeline) and serve it from `/usr/share/nginx/html` (or point nginx `root` there).
3. Configure your API base URL in the app to the **ApiUrl** (or to the same host via CloudFront with path-based routing).

## Optional: custom domain

- Add a certificate in ACM (us-east-1 for CloudFront).
- Add an alias (e.g. `app.example.com`) to the CloudFront distribution and point DNS to the distribution.
- For API Gateway, add a custom domain and map it to the HTTP API.
