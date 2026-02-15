# Art Marketplace – AWS CDK Infrastructure

This CDK app provisions the full backend for the Art Marketplace:

- **EC2** – Hosts the app (Vite/React build served by nginx).
- **ALB** – Application Load Balancer in front of EC2.
- **API Gateway** – HTTP API with VPC Link to the ALB (API traffic: Client → API Gateway → ALB → EC2).
- **CloudFront** – CDN; default origin = ALB (app), `/paintings/*` = S3 (object storage).
- **S3** – Object storage for painting/artifact images.
- **RDS PostgreSQL** – Users and orders (relational data).
- **DynamoDB** – Paintings metadata and artifacts metadata (key-value/document).
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

**Data stores:**

- **PostgreSQL (RDS)** – Users, orders. EC2 can connect using the endpoint and credentials from Secrets Manager (stack output **DbSecretArn**).
- **DynamoDB** – **PaintingsTable** (paintings metadata), **ArtifactsTable** (artifacts metadata). EC2 role has read/write access.

After deploy, stack outputs include:

- **AppUrl** – CloudFront URL (main app + CDN).
- **ApiUrl** – API Gateway URL (for API calls).
- **PaintingsBucketName** – S3 bucket for images.
- **PaintingsTableName** – DynamoDB table for paintings metadata.
- **ArtifactsTableName** – DynamoDB table for artifacts metadata.
- **DbEndpoint** – RDS PostgreSQL endpoint (users, orders).
- **DbSecretArn** – Secrets Manager ARN for DB username/password.
- **RedisEndpoint** – ElastiCache Redis endpoint (e.g. for cache client on EC2).
- **InstanceId** – EC2 instance ID (for SSM Session Manager or SSH if configured).

## Deploying the app to EC2

1. Build the frontend: from repo root, `npm run build`.
2. Copy `dist/` to the EC2 instance (e.g. via SSM, SCP, or a pipeline) and serve it from `/usr/share/nginx/html` (or point nginx `root` there).
3. Configure your API base URL in the app to the **ApiUrl** (or to the same host via CloudFront with path-based routing).

## Custom domain

To use your own domain (e.g. `app.yourdomain.com`) as the website URL:

1. **Register a domain** (Route 53 or any registrar) and ensure the hosted zone exists in Route 53.

2. **Request an ACM certificate** for your domain in **us-east-1** (required for CloudFront):
   - AWS Console → Certificate Manager (switch to **us-east-1**) → Request certificate.
   - Choose the domain (e.g. `app.yourdomain.com`), validate via DNS, add the CNAME to your hosted zone until it shows “Issued”.

3. **Deploy with context** (replace with your values):

   ```bash
   npx cdk deploy \
     -c domainName=app.yourdomain.com \
     -c certificateArn=arn:aws:acm:us-east-1:022706514418:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
     -c hostedZoneId=Z0123456789ABCDEFGHIJ \
     -c hostedZoneName=yourdomain.com
   ```

   - **domainName** – Full name for the site (e.g. `app.yourdomain.com`).
   - **certificateArn** – ARN of the ACM cert from step 2 (must be in **us-east-1**).
   - **hostedZoneId** – Route 53 hosted zone ID for the domain.
   - **hostedZoneName** – Zone name (e.g. `yourdomain.com`). Used to create the A/AAAA alias record.

   If you omit `hostedZoneId` and `hostedZoneName`, CloudFront will still get the custom domain and certificate, but you must add a CNAME at your DNS provider pointing the domain to the distribution domain (e.g. `d1234abcd.cloudfront.net`).

4. After deploy, **AppUrl** will be `https://app.yourdomain.com` (or whatever you set as `domainName`).
