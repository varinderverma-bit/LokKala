/**
 * Environment/stage configuration for multi-environment (UAT, Prod) and multi-region deployments.
 * Pass stage and region via context: -c stage=uat -c region=eu-west-1
 */

export type Stage = 'dev' | 'uat' | 'prod';

export interface EnvConfig {
  stage: Stage;
  region: string;
  account: string;
  /** Number of NAT gateways (1 = single AZ egress, 2 = one per AZ for prod HA) */
  natGateways: number;
  /** Max AZs for VPC subnets */
  maxAzs: number;
  /** EC2 instance type for app server */
  ec2InstanceType: string;
  /** RDS instance class */
  rdsInstanceClass: string;
  /** RDS allocated storage (GB) */
  rdsAllocatedStorage: number;
  /** RDS max allocated storage (GB) for autoscaling */
  rdsMaxAllocatedStorage: number;
  /** ElastiCache Redis node type */
  redisNodeType: string;
  /** Lambda memory (MB) for CQRS flatten */
  lambdaMemoryMb: number;
  /** Removal policy for data resources (RETAIN in prod/uat) */
  removalPolicy: 'retain' | 'destroy';
}

const defaultConfigs: Record<Stage, Omit<EnvConfig, 'stage' | 'region' | 'account'>> = {
  dev: {
    natGateways: 1,
    maxAzs: 2,
    ec2InstanceType: 't3.small',
    rdsInstanceClass: 't3.micro',
    rdsAllocatedStorage: 20,
    rdsMaxAllocatedStorage: 100,
    redisNodeType: 'cache.t3.micro',
    lambdaMemoryMb: 256,
    removalPolicy: 'destroy',
  },
  uat: {
    natGateways: 1,
    maxAzs: 2,
    ec2InstanceType: 't3.small',
    rdsInstanceClass: 't3.small',
    rdsAllocatedStorage: 20,
    rdsMaxAllocatedStorage: 100,
    redisNodeType: 'cache.t3.micro',
    lambdaMemoryMb: 256,
    removalPolicy: 'retain',
  },
  prod: {
    natGateways: 2,
    maxAzs: 3,
    ec2InstanceType: 't3.medium',
    rdsInstanceClass: 't3.small',
    rdsAllocatedStorage: 50,
    rdsMaxAllocatedStorage: 200,
    redisNodeType: 'cache.t3.small',
    lambdaMemoryMb: 512,
    removalPolicy: 'retain',
  },
};

export function getEnvConfig(
  stage: string,
  region: string,
  account: string
): EnvConfig {
  const normalizedStage = (stage?.toLowerCase() || 'dev') as Stage;
  const resolved = normalizedStage in defaultConfigs ? normalizedStage : 'dev';
  const base = defaultConfigs[resolved as Stage];
  return {
    stage: resolved as Stage,
    region,
    account,
    ...base,
  };
}

export function getStageFromContext(context: { stage?: unknown; region?: unknown; account?: unknown }): Stage {
  const stage = (context?.stage as string) || process.env.STAGE || 'dev';
  const normalized = String(stage).toLowerCase();
  if (normalized === 'uat' || normalized === 'prod' || normalized === 'dev') {
    return normalized as Stage;
  }
  return 'dev';
}
