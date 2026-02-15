import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as path from 'path';
import { Construct } from 'constructs';
import type { EnvConfig } from './env-config';

export interface ArtMarketplaceStackProps extends cdk.StackProps {
  envConfig: EnvConfig;
}

function parseInstanceType(s: string): [ec2.InstanceClass, ec2.InstanceSize] {
  const [family, size] = s.split('.').map((x) => x?.toUpperCase() || '');
  const cls = family in ec2.InstanceClass ? (ec2.InstanceClass as unknown as Record<string, ec2.InstanceClass>)[family] : ec2.InstanceClass.T3;
  const sz = size in ec2.InstanceSize ? (ec2.InstanceSize as unknown as Record<string, ec2.InstanceSize>)[size] : ec2.InstanceSize.SMALL;
  return [cls, sz];
}

export class ArtMarketplaceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ArtMarketplaceStackProps) {
    super(scope, id, props);

    const { envConfig } = props;
    const { stage, region, account } = envConfig;
    const removalPolicy =
      envConfig.removalPolicy === 'destroy' ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;

    const domainName = this.node.tryGetContext('domainName') as string | undefined;
    const certificateArn = this.node.tryGetContext('certificateArn') as string | undefined;
    const hostedZoneId = this.node.tryGetContext('hostedZoneId') as string | undefined;
    const hostedZoneName = this.node.tryGetContext('hostedZoneName') as string | undefined;

    // ─── VPC ─────────────────────────────────────────────────────────────────
    const vpc = new ec2.Vpc(this, 'ArtMarketplaceVpc', {
      maxAzs: envConfig.maxAzs,
      natGateways: envConfig.natGateways,
    });

    // ─── S3 bucket for painting images (object storage) ───────────────────────
    const paintingsBucket = new s3.Bucket(this, 'PaintingsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy,
      autoDeleteObjects: envConfig.removalPolicy === 'destroy',
    });

    // ─── DynamoDB table for paintings metadata ───────────────────────────────
    const paintingsTable = new dynamodb.Table(this, 'PaintingsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'regionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });
    paintingsTable.addGlobalSecondaryIndex({
      indexName: 'regionId-createdAt-index',
      partitionKey: { name: 'regionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ─── Redis (ElastiCache) for latency reduction ───────────────────────────
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: `Redis cache subnet group (${stage})`,
      subnetIds: vpc.privateSubnets.map((s) => s.subnetId),
      cacheSubnetGroupName: `art-mkt-redis-${stage}-${this.node.addr.slice(-8)}`,
    });

    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSg', {
      vpc,
      description: 'Security group for Redis',
      allowAllOutbound: false,
    });
    redisSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.allTcp());

    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: envConfig.redisNodeType,
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
    });
    redisCluster.addDependency(redisSubnetGroup);

    // ─── Security groups for ALB, NLB, EC2 ───────────────────────────────────
    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc,
      description: 'ALB security group',
      allowAllOutbound: true,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    const ec2Sg = new ec2.SecurityGroup(this, 'Ec2Sg', {
      vpc,
      description: 'EC2 app server security group',
      allowAllOutbound: true,
    });
    ec2Sg.addIngressRule(albSg, ec2.Port.tcp(80), 'From ALB');
    redisSecurityGroup.addIngressRule(ec2Sg, ec2.Port.tcp(6379), 'From EC2');

    // ─── RDS PostgreSQL (users, orders) ───────────────────────────────────────
    const rdsSg = new ec2.SecurityGroup(this, 'RdsSg', {
      vpc,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });
    rdsSg.addIngressRule(ec2Sg, ec2.Port.tcp(5432), 'PostgreSQL from EC2');
    rdsSg.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.allTcp());

    const [rdsClass, rdsSize] = parseInstanceType(envConfig.rdsInstanceClass);
    const dbInstance = new rds.DatabaseInstance(this, 'PostgresDb', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [rdsSg],
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(rdsClass, rdsSize),
      allocatedStorage: envConfig.rdsAllocatedStorage,
      maxAllocatedStorage: envConfig.rdsMaxAllocatedStorage,
      databaseName: 'artmarketplace',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      removalPolicy,
      instanceIdentifier: `art-mkt-db-${stage}`,
    });

    // ─── CQRS: Write-side table (user uploads – pictures, price, etc.) ─────────
    const itemUploadsTable = new dynamodb.Table(this, 'ItemUploadsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // ─── CQRS: Read-optimized table (flattened by Lambda from stream) ─────────
    const itemsReadModelTable = new dynamodb.Table(this, 'ItemsReadModelTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });
    itemsReadModelTable.addGlobalSecondaryIndex({
      indexName: 'type-createdAt-index',
      partitionKey: { name: 'type', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    itemsReadModelTable.addGlobalSecondaryIndex({
      indexName: 'regionId-createdAt-index',
      partitionKey: { name: 'regionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    itemsReadModelTable.addGlobalSecondaryIndex({
      indexName: 'categoryId-createdAt-index',
      partitionKey: { name: 'categoryId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ─── CQRS: Lambda flattens stream events into read model ───────────────────
    const cqrsFlattenFn = new lambda.Function(this, 'CqrsFlattenFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/cqrs-flatten')),
      environment: {
        READ_MODEL_TABLE_NAME: itemsReadModelTable.tableName,
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: envConfig.lambdaMemoryMb,
    });
    itemUploadsTable.grantStreamRead(cqrsFlattenFn);
    itemsReadModelTable.grantReadWriteData(cqrsFlattenFn);
    cqrsFlattenFn.addEventSource(
      new lambdaEventSources.DynamoEventSource(itemUploadsTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
      })
    );

    // ─── DynamoDB table for artifacts metadata ────────────────────────────────
    const artifactsTable = new dynamodb.Table(this, 'ArtifactsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'categoryId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });
    artifactsTable.addGlobalSecondaryIndex({
      indexName: 'categoryId-createdAt-index',
      partitionKey: { name: 'categoryId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ─── Backend: Users (for LokKala login) ───────────────────────────────────
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });
    usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ─── Backend: Orders & order status (Order Service) ───────────────────────
    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });
    ordersTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const orderStatusTable = new dynamodb.Table(this, 'OrderStatusTable', {
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });

    const inventoryTable = new dynamodb.Table(this, 'InventoryTable', {
      partitionKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });

    const shipmentsTable = new dynamodb.Table(this, 'ShipmentsTable', {
      partitionKey: { name: 'shipmentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });
    shipmentsTable.addGlobalSecondaryIndex({
      indexName: 'orderId-index',
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ─── IAM role for EC2 (S3, DynamoDB, RDS secret) ──────────────────────────
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
    paintingsBucket.grantReadWrite(ec2Role);
    paintingsTable.grantReadWriteData(ec2Role);
    artifactsTable.grantReadWriteData(ec2Role);
    itemUploadsTable.grantReadWriteData(ec2Role);
    itemsReadModelTable.grantReadData(ec2Role);
    if (dbInstance.secret) {
      dbInstance.secret.grantRead(ec2Role);
    }

    // ─── EC2 instance (app host) ─────────────────────────────────────────────
    const amzn2 = ec2.MachineImage.latestAmazonLinux2023({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y nginx',
      'echo "<!DOCTYPE html><html><body><h1>Art Marketplace</h1><p>Deploy your Vite build to /usr/share/nginx/html</p></body></html>" > /usr/share/nginx/html/index.html',
      'systemctl enable nginx',
      'systemctl start nginx'
    );

    const [ec2Class, ec2Size] = parseInstanceType(envConfig.ec2InstanceType);
    const instance = new ec2.Instance(this, 'AppInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2Class, ec2Size),
      machineImage: amzn2,
      securityGroup: ec2Sg,
      role: ec2Role,
      userData,
    });

    // ─── ALB (Application Load Balancer) ─────────────────────────────────────
    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const albTargetGroup = new elbv2.ApplicationTargetGroup(this, 'AlbTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      targets: [new targets.InstanceTarget(instance, 80)],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    const albListener = alb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [albTargetGroup],
    });

    // ─── API Gateway (HTTP API) with VPC Link to ALB ─────────────────────────
    const albIntegration = new apigatewayv2_integrations.HttpAlbIntegration(
      'AlbIntegration',
      albListener
    );

    const httpApi = new apigatewayv2.HttpApi(this, 'ArtMarketplaceApi', {
      apiName: `art-marketplace-api-${stage}`,
      description: 'API for Art Marketplace (paintings, regions, artists)',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.GET, apigatewayv2.CorsHttpMethod.POST, apigatewayv2.CorsHttpMethod.PUT, apigatewayv2.CorsHttpMethod.DELETE],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      defaultIntegration: albIntegration,
    });

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: albIntegration,
    });

    // ─── CloudFront (CDN): app origin = ALB, optional S3 for /paintings ───────
    const albOrigin = new origins.HttpOrigin(alb.loadBalancerDnsName, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      customHeaders: {
        'X-Forwarded-Host': 'art-marketplace',
      },
    });

    const s3Origin = new origins.S3Origin(paintingsBucket);

    const cert = domainName && certificateArn
      ? acm.Certificate.fromCertificateArn(this, 'Cert', certificateArn)
      : undefined;

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: albOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      },
      additionalBehaviors: {
        '/paintings/*': {
          origin: s3Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.seconds(0) },
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.seconds(0) },
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      ...(domainName && cert
        ? {
            domainNames: [domainName],
            certificate: cert,
          }
        : {}),
    });

    if (domainName && hostedZoneId && hostedZoneName) {
      const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', {
        hostedZoneId,
        zoneName: hostedZoneName,
      });
      const recordName = domainName === hostedZoneName ? undefined : domainName.replace(`.${hostedZoneName}`, '');
      new route53.ARecord(this, 'AliasRecord', {
        zone,
        recordName: recordName || undefined,
        target: route53.RecordTarget.fromAlias(
          new route53_targets.CloudFrontTarget(distribution)
        ),
      });
      new route53.AaaaRecord(this, 'AliasRecordV6', {
        zone,
        recordName: recordName || undefined,
        target: route53.RecordTarget.fromAlias(
          new route53_targets.CloudFrontTarget(distribution)
        ),
      });
    }

    // Allow CloudFront to reach the ALB (no OAC required for HTTP origin; for production use custom domain + HTTPS)
    // For HTTP origin from CF to ALB, we keep ALB on HTTP; in production you’d use HTTPS and OAC.

    const cdnBaseUrl = domainName ? `https://${domainName}` : `https://${distribution.distributionDomainName}`;

    // LokKalaService (BFF) and OrderService Lambdas
    const lokkalaServiceFn = new lambda.Function(this, 'LokKalaServiceFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/lokkala-service')),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        ITEMS_READ_MODEL_TABLE_NAME: itemsReadModelTable.tableName,
        ITEM_UPLOADS_TABLE_NAME: itemUploadsTable.tableName,
        ORDERS_TABLE_NAME: ordersTable.tableName,
        ORDER_STATUS_TABLE_NAME: orderStatusTable.tableName,
        INVENTORY_TABLE_NAME: inventoryTable.tableName,
        PAINTINGS_BUCKET_NAME: paintingsBucket.bucketName,
        CDN_BASE_URL: cdnBaseUrl,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });
    paintingsBucket.grantPut(lokkalaServiceFn);
    usersTable.grantReadData(lokkalaServiceFn);
    itemsReadModelTable.grantReadData(lokkalaServiceFn);
    itemUploadsTable.grantReadWriteData(lokkalaServiceFn);
    ordersTable.grantReadWriteData(lokkalaServiceFn);
    orderStatusTable.grantReadWriteData(lokkalaServiceFn);
    inventoryTable.grantReadWriteData(lokkalaServiceFn);

    const orderServiceFn = new lambda.Function(this, 'OrderServiceFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/order-service')),
      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
        ORDER_STATUS_TABLE_NAME: orderStatusTable.tableName,
        INVENTORY_TABLE_NAME: inventoryTable.tableName,
        SHIPMENTS_TABLE_NAME: shipmentsTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });
    ordersTable.grantReadWriteData(orderServiceFn);
    orderStatusTable.grantReadWriteData(orderServiceFn);
    inventoryTable.grantReadWriteData(orderServiceFn);
    shipmentsTable.grantReadWriteData(orderServiceFn);

    const lokkalaIntegration = new apigatewayv2_integrations.HttpLambdaIntegration(
      'LokKalaIntegration',
      lokkalaServiceFn
    );
    const orderServiceIntegration = new apigatewayv2_integrations.HttpLambdaIntegration(
      'OrderServiceIntegration',
      orderServiceFn
    );
    httpApi.addRoutes({ path: '/api/lokkala', methods: [apigatewayv2.HttpMethod.ANY], integration: lokkalaIntegration });
    httpApi.addRoutes({ path: '/api/lokkala/{proxy+}', methods: [apigatewayv2.HttpMethod.ANY], integration: lokkalaIntegration });
    httpApi.addRoutes({ path: '/api/orders', methods: [apigatewayv2.HttpMethod.ANY], integration: orderServiceIntegration });
    httpApi.addRoutes({ path: '/api/orders/{proxy+}', methods: [apigatewayv2.HttpMethod.ANY], integration: orderServiceIntegration });

    // ─── Outputs ─────────────────────────────────────────────────────────────
    const exportSuffix = stage;
    const appUrl = cdnBaseUrl;
    new cdk.CfnOutput(this, 'Stage', { value: stage, description: 'Deployment stage (dev/uat/prod)', exportName: `ArtMarketplaceStage-${exportSuffix}` });
    new cdk.CfnOutput(this, 'Region', { value: region, description: 'AWS region', exportName: `ArtMarketplaceRegion-${exportSuffix}` });
    new cdk.CfnOutput(this, 'AppUrl', {
      value: appUrl,
      description: 'Application URL (CloudFront CDN or custom domain)',
      exportName: `ArtMarketplaceAppUrl-${exportSuffix}`,
    });
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway URL (use for /api calls; put behind CloudFront or call directly)',
      exportName: `ArtMarketplaceApiUrl-${exportSuffix}`,
    });
    new cdk.CfnOutput(this, 'PaintingsBucketName', {
      value: paintingsBucket.bucketName,
      description: 'S3 bucket for painting images',
      exportName: `ArtMarketplacePaintingsBucket-${exportSuffix}`,
    });
    new cdk.CfnOutput(this, 'PaintingsTableName', {
      value: paintingsTable.tableName,
      description: 'DynamoDB table for paintings metadata',
      exportName: `ArtMarketplacePaintingsTable-${exportSuffix}`,
    });
    new cdk.CfnOutput(this, 'ArtifactsTableName', {
      value: artifactsTable.tableName,
      description: 'DynamoDB table for artifacts metadata',
      exportName: `ArtMarketplaceArtifactsTable-${exportSuffix}`,
    });
    new cdk.CfnOutput(this, 'ItemUploadsTableName', {
      value: itemUploadsTable.tableName,
      description: 'CQRS write table: user uploads (pictures, price, etc.); CDC to Lambda',
      exportName: `ArtMarketplaceItemUploadsTable-${exportSuffix}`,
    });
    new cdk.CfnOutput(this, 'ItemsReadModelTableName', {
      value: itemsReadModelTable.tableName,
      description: 'CQRS read model: flattened, read-optimized (filled by Lambda)',
      exportName: `ArtMarketplaceItemsReadModelTable-${exportSuffix}`,
    });
    new cdk.CfnOutput(this, 'UsersTableName', { value: usersTable.tableName, description: 'Users table (LokKala login)', exportName: `ArtMarketplaceUsersTable-${exportSuffix}` });
    new cdk.CfnOutput(this, 'OrdersTableName', { value: ordersTable.tableName, description: 'Orders table', exportName: `ArtMarketplaceOrdersTable-${exportSuffix}` });
    new cdk.CfnOutput(this, 'OrderStatusTableName', { value: orderStatusTable.tableName, description: 'Order status history', exportName: `ArtMarketplaceOrderStatusTable-${exportSuffix}` });
    new cdk.CfnOutput(this, 'InventoryTableName', { value: inventoryTable.tableName, description: 'Inventory table', exportName: `ArtMarketplaceInventoryTable-${exportSuffix}` });
    new cdk.CfnOutput(this, 'ShipmentsTableName', { value: shipmentsTable.tableName, description: 'Shipments table', exportName: `ArtMarketplaceShipmentsTable-${exportSuffix}` });
    new cdk.CfnOutput(this, 'LokKalaApiPath', { value: `${httpApi.apiEndpoint}/api/lokkala`, description: 'LokKala BFF base URL', exportName: `ArtMarketplaceLokKalaApiPath-${exportSuffix}` });
    new cdk.CfnOutput(this, 'OrdersApiPath', { value: `${httpApi.apiEndpoint}/api/orders`, description: 'Order Service base URL', exportName: `ArtMarketplaceOrdersApiPath-${exportSuffix}` });
    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL endpoint (users, orders)',
      exportName: `ArtMarketplaceDbEndpoint-${exportSuffix}`,
    });
    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: dbInstance.secret?.secretArn ?? '',
      description: 'Secrets Manager ARN for DB credentials',
      exportName: `ArtMarketplaceDbSecretArn-${exportSuffix}`,
    });
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrRedisEndpointAddress,
      description: 'Redis (ElastiCache) endpoint for cache',
      exportName: `ArtMarketplaceRedisEndpoint-${exportSuffix}`,
    });
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 instance ID (app host)',
      exportName: `ArtMarketplaceInstanceId-${exportSuffix}`,
    });
  }
}
