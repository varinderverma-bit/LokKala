'use strict';

const AWS = require('aws-sdk');
const doc = new AWS.DynamoDB.DocumentClient();
const logger = require('./logger');

const READ_MODEL_TABLE = process.env.READ_MODEL_TABLE_NAME;

/**
 * Flatten a raw upload record (plain object after unmarshall) into a read-optimized item.
 */
function flattenUpload(raw) {
  const id = raw.id;
  const type = raw.type || 'ITEM';
  const createdAt = raw.createdAt || new Date().toISOString();
  const updatedAt = new Date().toISOString();

  const imageKeys = raw.imageKeys || raw.images || [];
  const price = raw.price ?? raw.priceAmount;
  const currency = raw.currency || 'USD';
  const title = (raw.title || '').toString();
  const description = (raw.description || '').toString();
  const regionId = (raw.regionId || '').toString() || null;
  const categoryId = (raw.categoryId || '').toString() || null;
  const userId = (raw.userId || '').toString() || null;
  const status = raw.status || 'PROCESSED';
  const metadata = raw.metadata || {};

  return {
    id,
    type,
    createdAt,
    updatedAt,
    title,
    description,
    price: price != null ? price : null,
    currency,
    imageKeys: Array.isArray(imageKeys) ? imageKeys : [].concat(imageKeys || []),
    regionId,
    categoryId,
    userId,
    status,
    ...(typeof metadata === 'object' && metadata !== null ? metadata : {}),
  };
}

exports.handler = async (event) => {
  if (!READ_MODEL_TABLE) {
    throw new Error('READ_MODEL_TABLE_NAME not set');
  }

  const recordCount = (event.Records || []).length;
  logger.info('Processing DynamoDB stream', { recordCount });

  const results = { processed: 0, failed: 0 };

  for (const record of event.Records || []) {
    if (record.eventSource !== 'aws:dynamodb') continue;

    const eventName = record.eventName;
    const keys = record.dynamodb?.Keys;
    const newImage = record.dynamodb?.NewImage;

    try {
      if (eventName === 'REMOVE' && keys) {
        const id = keys.id?.S ?? keys.id;
        await doc.delete({
          TableName: READ_MODEL_TABLE,
          Key: { id },
        }).promise();
        results.processed++;
        continue;
      }

      if ((eventName === 'INSERT' || eventName === 'MODIFY') && newImage) {
        const raw = AWS.DynamoDB.Converter.unmarshall(newImage);
        const flat = flattenUpload(raw);
        await doc.put({
          TableName: READ_MODEL_TABLE,
          Item: flat,
        }).promise();
        results.processed++;
      }
    } catch (err) {
      results.failed++;
      logger.error('Record processing failed', { eventID: record.eventID, error: err.message });
      throw err;
    }
  }

  logger.info('Stream processing complete', { ...results, recordCount });
  return results;
};
