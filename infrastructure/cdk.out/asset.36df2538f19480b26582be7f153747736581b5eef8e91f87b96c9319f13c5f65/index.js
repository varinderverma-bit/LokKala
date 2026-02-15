/**
 * LokKalaService – BFF for Lok Kala art marketplace.
 * Handles: login, presigned upload URLs, artifact list with CDN URLs, order creation (CC capture).
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { logger } from './logger.js';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const USERS_TABLE = process.env.USERS_TABLE_NAME;
const ITEMS_READ_TABLE = process.env.ITEMS_READ_MODEL_TABLE_NAME;
const ITEM_UPLOADS_TABLE = process.env.ITEM_UPLOADS_TABLE_NAME;
const ORDERS_TABLE = process.env.ORDERS_TABLE_NAME;
const ORDER_STATUS_TABLE = process.env.ORDER_STATUS_TABLE_NAME;
const INVENTORY_TABLE = process.env.INVENTORY_TABLE_NAME;
const PAINTINGS_BUCKET = process.env.PAINTINGS_BUCKET_NAME;
const CDN_BASE_URL = process.env.CDN_BASE_URL || '';

function json(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

function parseBody(body) {
  if (!body) return {};
  try {
    return typeof body === 'string' ? JSON.parse(body) : body;
  } catch {
    return {};
  }
}

/** Resolve CDN URL for an S3 key (under paintings/). */
function cdnUrl(key) {
  if (!key) return '';
  const normalized = key.startsWith('paintings/') ? key : `paintings/${key}`;
  return CDN_BASE_URL ? `${CDN_BASE_URL.replace(/\/$/, '')}/${normalized}` : normalized;
}

/** POST /auth/login – validate user, return token placeholder */
async function handleLogin(body) {
  const { email, password } = parseBody(body);
  if (!email || !password) {
    return json({ error: 'email and password required' }, 400);
  }
  const res = await dynamo.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': email },
  }));
  const user = res.Items?.[0];
  if (!user) {
    logger.warn('Login failed: user not found');
    return json({ error: 'Invalid credentials' }, 401);
  }
  // In production: use bcrypt.compare(password, user.passwordHash)
  const passwordOk = user.passwordHash === password;
  if (!passwordOk) {
    logger.warn('Login failed: invalid password', { userId: user.userId });
    return json({ error: 'Invalid credentials' }, 401);
  }
  const token = `lk_${randomUUID()}`;
  logger.info('Login successful', { userId: user.userId, email: user.email });
  return json({ token, userId: user.userId, email: user.email });
}

/** POST /upload/presign – generate presigned URL for S3 upload */
async function handlePresign(body) {
  const { objectKey, contentType, artifactId } = parseBody(body);
  const key = objectKey || (artifactId ? `paintings/${artifactId}` : null);
  if (!key || !contentType) {
    return json({ error: 'objectKey and contentType required' }, 400);
  }
  const normalizedKey = key.startsWith('paintings/') ? key : `paintings/${key}`;
  const command = new PutObjectCommand({
    Bucket: PAINTINGS_BUCKET,
    Key: normalizedKey,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  return json({
    uploadUrl,
    objectKey: normalizedKey,
    cdnUrl: cdnUrl(normalizedKey),
  });
}

/** GET /artifacts/:id – single artifact with CDN URLs */
async function handleGetArtifactById(artifactId) {
  const res = await dynamo.send(new GetCommand({
    TableName: ITEMS_READ_TABLE,
    Key: { id: artifactId },
  }));
  if (!res.Item) {
    return json({ error: 'Not found' }, 404);
  }
  const item = res.Item;
  const imageKeys = item.imageKeys || [];
  const images = imageKeys.map((k) => cdnUrl(k));
  return json({
    ...item,
    images: images.length ? images : item.images || [],
    imageKeys,
  });
}

/** GET /artifacts – list items with CDN image URLs for UI (pull from CDN) */
async function handleGetArtifacts(query) {
  const page = Math.max(1, parseInt(query?.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(query?.pageSize || '12', 10)));
  const regionId = query?.regionId || null;

  let request = {
    TableName: ITEMS_READ_TABLE,
    IndexName: 'type-createdAt-index',
    KeyConditionExpression: '#t = :type',
    ExpressionAttributeNames: { '#t': 'type' },
    ExpressionAttributeValues: { ':type': 'ITEM' },
    ScanIndexForward: false,
    Limit: pageSize * 3,
  };
  if (regionId) {
    request = {
      TableName: ITEMS_READ_TABLE,
      IndexName: 'regionId-createdAt-index',
      KeyConditionExpression: 'regionId = :r',
      ExpressionAttributeValues: { ':r': regionId },
      ScanIndexForward: false,
      Limit: pageSize * 3,
    };
  }

  const res = await dynamo.send(new QueryCommand(request));
  let items = res.Items || [];
  if (regionId && request.IndexName === 'type-createdAt-index') {
    items = items.filter((i) => i.regionId === regionId);
  }
  const total = items.length;
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const withCdnUrls = pageItems.map((item) => {
    const imageKeys = item.imageKeys || [];
    const images = imageKeys.map((k) => cdnUrl(k));
    return {
      ...item,
      images: images.length ? images : item.images || [],
      imageKeys,
    };
  });

  return json({
    items: withCdnUrls,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

/** POST /orders – capture CC details (placeholder), create order */
async function handleCreateOrder(body) {
  const { userId, items, paymentMethodId, shippingAddress } = parseBody(body);
  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return json({ error: 'userId and items array required' }, 400);
  }
  const orderId = randomUUID();
  const now = new Date().toISOString();
  const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  await dynamo.send(new PutCommand({
    TableName: ORDERS_TABLE,
    Item: {
      orderId,
      userId,
      items,
      total,
      currency: 'USD',
      paymentMethodId: paymentMethodId || null,
      shippingAddress: shippingAddress || null,
      status: 'CREATED',
      createdAt: now,
      updatedAt: now,
    },
  }));

  await dynamo.send(new PutCommand({
    TableName: ORDER_STATUS_TABLE,
    Item: {
      orderId,
      timestamp: now,
      status: 'CREATED',
      message: 'Order placed',
    },
  }));

  // Reserve inventory (simplified: decrement per itemId)
  for (const line of items) {
    const itemId = line.artId || line.itemId || line.id;
    if (itemId) {
      try {
        const inv = await dynamo.send(new GetCommand({
          TableName: INVENTORY_TABLE,
          Key: { itemId },
        }));
        if (inv.Item) {
          const qty = Math.max(0, (inv.Item.quantity || 0) - (line.quantity || 1));
          await dynamo.send(new PutCommand({
            TableName: INVENTORY_TABLE,
            Item: { ...inv.Item, quantity: qty, updatedAt: now },
          }));
        }
      } catch (_) {}
    }
  }

  logger.info('Order created', { orderId, userId, total, itemCount: items.length });
  return json({ orderId, status: 'CREATED', total });
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const path = (event.rawPath || event.path || '').replace(/^\/api\/lokkala/, '') || '/';
  const pathSegments = path.split('/').filter(Boolean);
  const body = event.body;
  const query = event.queryStringParameters || {};
  const requestId = event.requestContext?.requestId || event.requestContext?.http?.requestId || 'unknown';

  logger.info('Request received', { requestId, method, path });

  try {
    // POST /auth/login
    if (method === 'POST' && (path === '/auth/login' || pathSegments[0] === 'auth' && pathSegments[1] === 'login')) {
      return handleLogin(body);
    }
    // POST /upload/presign
    if (method === 'POST' && (path === '/upload/presign' || (pathSegments[0] === 'upload' && pathSegments[1] === 'presign'))) {
      return handlePresign(body);
    }
    // GET /artifacts (list)
    if (method === 'GET' && (path === '/artifacts' || (pathSegments[0] === 'artifacts' && !pathSegments[1]))) {
      return handleGetArtifacts(query);
    }
    // GET /artifacts/:id
    if (method === 'GET' && pathSegments[0] === 'artifacts' && pathSegments[1]) {
      return handleGetArtifactById(pathSegments[1]);
    }
    // POST /orders
    if (method === 'POST' && (path === '/orders' || pathSegments[0] === 'orders')) {
      return handleCreateOrder(body);
    }

    logger.warn('Route not found', { requestId, path, method });
    return json({ error: 'Not found', path, method }, 404);
  } catch (err) {
    logger.error('Unhandled error', { requestId, error: err.message, stack: err.stack });
    return json({ error: 'Internal server error' }, 500);
  }
};
