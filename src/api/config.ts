/**
 * API configuration. Set VITE_API_BASE_URL to point to the LokKala BFF (e.g. API Gateway or CloudFront).
 * When set, art list and artifact details are loaded from the BFF; image URLs are CDN URLs.
 */
const base = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL;
export const API_BASE_URL = typeof base === 'string' && base.length > 0 ? base.replace(/\/$/, '') : '';

export const LOKKALA_PATH = '/api/lokkala';
export const ORDERS_PATH = '/api/orders';

export function lokkalaUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${LOKKALA_PATH}${p}`;
}

export function ordersUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${ORDERS_PATH}${p}`;
}
