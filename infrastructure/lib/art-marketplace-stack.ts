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
import { Construct } from 'constructs';

export class ArtMarketplaceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── VPC ─────────────────────────────────────────────────────────────────
    const vpc = new ec2.Vpc(this, 'ArtMarketplaceVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // ─── S3 bucket for painting images (object storage) ───────────────────────
    const paintingsBucket = new s3.Bucket(this, 'PaintingsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // ─── DynamoDB table for paintings metadata ───────────────────────────────
    const paintingsTable = new dynamodb.Table(this, 'PaintingsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'regionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    paintingsTable.addGlobalSecondaryIndex({
      indexName: 'regionId-createdAt-index',
      partitionKey: { name: 'regionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ─── Redis (ElastiCache) for latency reduction ───────────────────────────
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cache',
      subnetIds: vpc.privateSubnets.map((s) => s.subnetId),
      cacheSubnetGroupName: `art-marketplace-redis-${this.node.addr.slice(-8)}`,
    });

    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSg', {
      vpc,
      description: 'Security group for Redis',
      allowAllOutbound: false,
    });
    redisSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.allTcp());

    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: 'cache.t3.micro',
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

    // ─── IAM role for EC2 (S3, DynamoDB) ──────────────────────────────────────
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
    paintingsBucket.grantReadWrite(ec2Role);
    paintingsTable.grantReadWriteData(ec2Role);

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

    const instance = new ec2.Instance(this, 'AppInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
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
      apiName: 'art-marketplace-api',
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
    });

    // Allow CloudFront to reach the ALB (no OAC required for HTTP origin; for production use custom domain + HTTPS)
    // For HTTP origin from CF to ALB, we keep ALB on HTTP; in production you’d use HTTPS and OAC.

    // ─── Outputs ─────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'AppUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Application URL (CloudFront CDN)',
      exportName: 'ArtMarketplaceAppUrl',
    });
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway URL (use for /api calls; put behind CloudFront or call directly)',
      exportName: 'ArtMarketplaceApiUrl',
    });
    new cdk.CfnOutput(this, 'PaintingsBucketName', {
      value: paintingsBucket.bucketName,
      description: 'S3 bucket for painting images',
      exportName: 'ArtMarketplacePaintingsBucket',
    });
    new cdk.CfnOutput(this, 'PaintingsTableName', {
      value: paintingsTable.tableName,
      description: 'DynamoDB table for paintings metadata',
      exportName: 'ArtMarketplacePaintingsTable',
    });
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrRedisEndpointAddress,
      description: 'Redis (ElastiCache) endpoint for cache',
      exportName: 'ArtMarketplaceRedisEndpoint',
    });
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 instance ID (app host)',
      exportName: 'ArtMarketplaceInstanceId',
    });
  }
}
