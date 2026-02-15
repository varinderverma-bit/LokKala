# Art Marketplace – AWS CDK Infrastructure

This CDK app provisions the full backend for the Art Marketplace:

- **EC2** – Hosts the app (Vite/React build served by nginx).
- **ALB** – Application Load Balancer in front of EC2.
- **API Gateway** – HTTP API with VPC Link to the ALB (API traffic: Client → API Gateway → ALB → EC2).
- **CloudFront** – CDN; default origin = ALB (app), `/paintings/*` = S3 (object storage).
- **S3** – Object storage for painting/artifact images.
- **RDS PostgreSQL** – Users and orders (relational data).
- **DynamoDB** – Paintings metadata, artifacts metadata, **CQRS write table (ItemUploads)**, and **read model (ItemsReadModel)**.
- **ElastiCache Redis** – Cache for lower latency.
- **CQRS** – User uploads go to **ItemUploads**; DynamoDB Streams (CDC) trigger a **Lambda** that flattens data into **ItemsReadModel** (read-optimized).
- **LokKalaService (BFF)** – Stateless Lambda behind API Gateway (`/api/lokkala`): user login, presigned S3 upload URLs, artifact list and single artifact with **CDN image URLs**, and order creation (CC capture).
- **Order Service** – Lambda behind API Gateway (`/api/orders`): list/get orders by user, order status table, inventory management, shipment details and progress.

## Backend API (LokKalaService & Order Service)

**LokKalaService (BFF)** – base path `/api/lokkala`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login; body `{ email, password }`; returns `{ token, userId, email }`. |
| POST | `/upload/presign` | Presigned URL for uploading artifact image to S3; body `{ objectKey, contentType }` or `{ artifactId, contentType }`. |
| GET | `/artifacts` | List artifacts with CDN image URLs; query `page`, `pageSize`, `regionId`. |
| GET | `/artifacts/:id` | Single artifact with CDN URLs. |
| POST | `/orders` | Create order; body `{ userId, items, paymentMethodId?, shippingAddress? }`. |

**Order Service** – base path `/api/orders`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/?userId=` | List orders for user. |
| GET | `/:orderId` | Order detail. |
| GET | `/:orderId/status` | Order status history. |
| PATCH | `/:orderId/status` | Add status (body `{ status, message? }`). |
| GET | `/:orderId/shipment` | Shipment(s) for order. |
| PATCH | `/:orderId/shipment` | Add/update shipment (body `{ trackingNumber?, carrier?, status?, events? }`). |
| GET | `/inventory` | List inventory. |
| GET | `/inventory/:itemId` | Inventory item. |
| PATCH | `/inventory/:itemId` | Update quantity (body `{ quantity?, reserved? }`). |

**DynamoDB tables:** UsersTable (login), OrdersTable, OrderStatusTable (tracks order status per user), InventoryTable, ShipmentsTable. Stack outputs include **LokKalaApiPath** and **OrdersApiPath** (full base URLs).

**UI and CDN:** Set `VITE_API_BASE_URL` to the API Gateway URL (stack output **ApiUrl**). The UI then loads artifact data from the BFF; image URLs in responses are CloudFront (CDN) URLs so the browser pulls images from the CDN.

## Prerequisites

- Node.js 18+
- AWS CLI configured (`aws configure`)
- Bootstrapped CDK in the account/region:  
  `cdk bootstrap`

## Multi-environment (UAT, Prod) and multi-region

The stack is **parameterized by stage and region** so you can deploy the same infra to **UAT**, **Prod**, and different regions.

**Context parameters:**

| Parameter   | Description | Default |
|------------|-------------|--------|
| `stage`    | Environment: `dev`, `uat`, or `prod` | `dev` (or env `STAGE`) |
| `region`   | AWS region to deploy into | `CDK_DEFAULT_REGION` or `us-east-1` |
| `account`  | AWS account ID | `CDK_DEFAULT_ACCOUNT` or `022706514418` |

**Examples:**

```bash
# UAT in us-east-1 (default account/region from AWS profile)
npx cdk deploy -c stage=uat

# Prod in eu-west-1
npx cdk deploy -c stage=prod -c region=eu-west-1

# UAT in ap-south-1 with explicit account
npx cdk deploy -c stage=uat -c region=ap-south-1 -c account=022706514418
```

**What changes per stage:**

- **Stack name:** `ArtMarketplaceStack-{stage}` (e.g. `ArtMarketplaceStack-uat`, `ArtMarketplaceStack-prod`).
- **Tags:** All resources are tagged with `Environment`, `Stage`, `Region`, `Project`.
- **Config (see `lib/env-config.ts`):**
  - **dev:** 1 NAT, 2 AZs, t3.small EC2, t3.micro RDS, cache.t3.micro Redis, 256 MB Lambda; removal policy DESTROY.
  - **uat:** 1 NAT, 2 AZs, t3.small EC2/RDS, cache.t3.micro Redis; removal policy RETAIN.
  - **prod:** 2 NATs, 3 AZs, t3.medium EC2, t3.small RDS, cache.t3.small Redis, 512 MB Lambda; removal policy RETAIN.
- **Export names:** All stack output export names are suffixed with the stage (e.g. `ArtMarketplaceAppUrl-uat`) so multiple stacks in the same account/region do not collide.

**Bootstrap:** Run `cdk bootstrap` in each account/region where you deploy (e.g. `cdk bootstrap aws://022706514418/eu-west-1`).

## Install and synth

```bash
cd infrastructure
npm install
npm run build
npx cdk synth
```

## Deploy

```bash
# Default (dev, default region from profile)
npx cdk deploy

# Specific stage and/or region
npx cdk deploy -c stage=uat -c region=us-east-1
npx cdk deploy -c stage=prod -c region=eu-west-1
```

**Data stores:**

- **PostgreSQL (RDS)** – Users, orders. EC2 can connect using the endpoint and credentials from Secrets Manager (stack output **DbSecretArn**).
- **DynamoDB** – **PaintingsTable** (paintings metadata), **ArtifactsTable** (artifacts metadata), **ItemUploadsTable** (CQRS write), **ItemsReadModelTable** (CQRS read). EC2 has write to ItemUploads and read from ItemsReadModel.

After deploy, stack outputs include:

- **AppUrl** – CloudFront URL (main app + CDN).
- **ApiUrl** – API Gateway URL (for API calls).
- **PaintingsBucketName** – S3 bucket for images.
- **PaintingsTableName** – DynamoDB table for paintings metadata.
- **ArtifactsTableName** – DynamoDB table for artifacts metadata.
- **ItemUploadsTableName** – CQRS write table (user uploads; CDC to Lambda).
- **ItemsReadModelTableName** – CQRS read model (flattened, read-optimized).
- **UsersTableName**, **OrdersTableName**, **OrderStatusTableName**, **InventoryTableName**, **ShipmentsTableName** – Backend tables for LokKala and Order Service.
- **LokKalaApiPath**, **OrdersApiPath** – Full base URLs for the BFF and Order Service.
- **DbEndpoint** – RDS PostgreSQL endpoint (users, orders).
- **DbSecretArn** – Secrets Manager ARN for DB username/password.
- **RedisEndpoint** – ElastiCache Redis endpoint (e.g. for cache client on EC2).
- **InstanceId** – EC2 instance ID (for SSM Session Manager or SSH if configured).

## CQRS (Command Query Responsibility Segregation)

1. **Write path** – The app (or API on EC2) writes user uploads to **ItemUploadsTable**: e.g. `id`, `type` (PAINTING | ARTIFACT), `imageKeys`, `price`, `currency`, `title`, `description`, `regionId`, `categoryId`, `userId`, `metadata`, `createdAt`, `status`.
2. **CDC** – DynamoDB Streams on ItemUploads (NEW_AND_OLD_IMAGES) triggers the **CqrsFlattenFn** Lambda on every insert/update/delete.
3. **Lambda** – Flattens the stream record (nested objects, arrays) and writes to **ItemsReadModelTable**. Deletes in the write table cause a delete in the read model.
4. **Read path** – Queries and list pages read from **ItemsReadModelTable** (and its GSIs: `type-createdAt-index`, `regionId-createdAt-index`, `categoryId-createdAt-index`) for fast, denormalized reads.

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
