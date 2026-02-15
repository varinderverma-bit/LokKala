/**
 * OrderService – orders, inventory, shipment, order status.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const ORDERS_TABLE = process.env.ORDERS_TABLE_NAME;
const ORDER_STATUS_TABLE = process.env.ORDER_STATUS_TABLE_NAME;
const INVENTORY_TABLE = process.env.INVENTORY_TABLE_NAME;
const SHIPMENTS_TABLE = process.env.SHIPMENTS_TABLE_NAME;

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

/** GET /orders?userId= – list orders for a user */
async function handleListOrders(query) {
  const userId = query?.userId;
  if (!userId) {
    return json({ error: 'userId query required' }, 400);
  }
  const res = await dynamo.send(new QueryCommand({
    TableName: ORDERS_TABLE,
    IndexName: 'userId-createdAt-index',
    KeyConditionExpression: 'userId = :u',
    ExpressionAttributeValues: { ':u': userId },
    ScanIndexForward: false,
  }));
  return json({ orders: res.Items || [] });
}

/** GET /orders/:orderId – order detail */
async function handleGetOrder(orderId) {
  const res = await dynamo.send(new GetCommand({
    TableName: ORDERS_TABLE,
    Key: { orderId },
  }));
  if (!res.Item) {
    return json({ error: 'Order not found' }, 404);
  }
  return json(res.Item);
}

/** GET /orders/:orderId/status – order status history */
async function handleGetOrderStatus(orderId) {
  const res = await dynamo.send(new QueryCommand({
    TableName: ORDER_STATUS_TABLE,
    KeyConditionExpression: 'orderId = :o',
    ExpressionAttributeValues: { ':o': orderId },
    ScanIndexForward: true,
  }));
  const statuses = (res.Items || []).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return json({ orderId, statuses });
}

/** PATCH /orders/:orderId/status – add status (internal/admin) */
async function handleUpdateOrderStatus(orderId, body) {
  const { status, message } = parseBody(body);
  if (!status) {
    return json({ error: 'status required' }, 400);
  }
  const now = new Date().toISOString();
  await dynamo.send(new PutCommand({
    TableName: ORDER_STATUS_TABLE,
    Item: { orderId, timestamp: now, status, message: message || '' },
  }));
  await dynamo.send(new UpdateCommand({
    TableName: ORDERS_TABLE,
    Key: { orderId },
    UpdateExpression: 'SET #s = :s, updatedAt = :t',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': status, ':t': now },
  }));
  return json({ orderId, status, timestamp: now });
}

/** GET /orders/:orderId/shipment – shipment details */
async function handleGetShipment(orderId) {
  const res = await dynamo.send(new QueryCommand({
    TableName: SHIPMENTS_TABLE,
    IndexName: 'orderId-index',
    KeyConditionExpression: 'orderId = :o',
    ExpressionAttributeValues: { ':o': orderId },
  }));
  const shipments = res.Items || [];
  return json({ orderId, shipments });
}

/** PATCH /orders/:orderId/shipment – add shipment / update progress */
async function handleUpdateShipment(orderId, body) {
  const { trackingNumber, carrier, status, events } = parseBody(body);
  const shipmentId = `ship_${orderId}_${Date.now()}`;
  const now = new Date().toISOString();
  const item = {
    shipmentId,
    orderId,
    trackingNumber: trackingNumber || '',
    carrier: carrier || '',
    status: status || 'CREATED',
    events: Array.isArray(events) ? events : [{ timestamp: now, status: status || 'CREATED' }],
    createdAt: now,
    updatedAt: now,
  };
  await dynamo.send(new PutCommand({
    TableName: SHIPMENTS_TABLE,
    Item: item,
  }));
  return json(item);
}

/** GET /inventory – list inventory */
async function handleListInventory() {
  const res = await dynamo.send(new ScanCommand({
    TableName: INVENTORY_TABLE,
  }));
  return json({ items: res.Items || [] });
}

/** GET /inventory/:itemId */
async function handleGetInventory(itemId) {
  const res = await dynamo.send(new GetCommand({
    TableName: INVENTORY_TABLE,
    Key: { itemId },
  }));
  if (!res.Item) {
    return json({ error: 'Item not found' }, 404);
  }
  return json(res.Item);
}

/** PATCH /inventory/:itemId – update quantity */
async function handleUpdateInventory(itemId, body) {
  const { quantity, reserved } = parseBody(body);
  const now = new Date().toISOString();
  const res = await dynamo.send(new GetCommand({
    TableName: INVENTORY_TABLE,
    Key: { itemId },
  }));
  const existing = res.Item || { itemId, quantity: 0, reserved: 0 };
  const nextQty = quantity !== undefined ? quantity : existing.quantity;
  const nextReserved = reserved !== undefined ? reserved : existing.reserved;
  await dynamo.send(new PutCommand({
    TableName: INVENTORY_TABLE,
    Item: {
      ...existing,
      itemId,
      quantity: nextQty,
      reserved: nextReserved,
      updatedAt: now,
    },
  }));
  return json({ itemId, quantity: nextQty, reserved: nextReserved });
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const path = (event.rawPath || event.path || '').replace(/^\/api\/orders/, '') || '/';
  const pathSegments = path.split('/').filter(Boolean);
  const body = event.body;
  const query = event.queryStringParameters || {};
  try {
    // path after /api/orders is e.g. "" or "123" or "123/status" or "inventory" or "inventory/item1"
    const first = pathSegments[0];
    const second = pathSegments[1];
    const orderId = first && first !== 'inventory' ? first : null;
    const sub = second;

    // GET / (or /orders) with userId query
    if (method === 'GET' && pathSegments.length === 0) {
      return handleListOrders(query);
    }
    // GET /inventory
    if (method === 'GET' && first === 'inventory' && !second) {
      return handleListInventory();
    }
    // GET /inventory/:itemId
    if (method === 'GET' && first === 'inventory' && second) {
      return handleGetInventory(second);
    }
    // PATCH /inventory/:itemId
    if (method === 'PATCH' && first === 'inventory' && second) {
      return handleUpdateInventory(second, body);
    }
    // GET /:orderId
    if (method === 'GET' && orderId && !sub) {
      return handleGetOrder(orderId);
    }
    // GET /:orderId/status
    if (method === 'GET' && orderId && sub === 'status') {
      return handleGetOrderStatus(orderId);
    }
    // PATCH /:orderId/status
    if (method === 'PATCH' && orderId && sub === 'status') {
      return handleUpdateOrderStatus(orderId, body);
    }
    // GET /:orderId/shipment
    if (method === 'GET' && orderId && sub === 'shipment') {
      return handleGetShipment(orderId);
    }
    // PATCH /:orderId/shipment
    if (method === 'PATCH' && orderId && sub === 'shipment') {
      return handleUpdateShipment(orderId, body);
    }
    // GET /:orderId when orderId is present (already handled above with !sub)
    if (method === 'GET' && orderId) {
      return handleGetOrder(orderId);
    }

    return json({ error: 'Not found', path, method }, 404);
  } catch (err) {
    console.error('OrderService error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
