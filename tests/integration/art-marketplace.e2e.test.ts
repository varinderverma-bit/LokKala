/**
 * End-to-end API integration tests for the Art Marketplace.
 * Run against a deployed API: E2E_API_BASE_URL (e.g. API Gateway URL from CDK outputs).
 *
 * Flow covered: LokKala artifacts list → single artifact → Orders list (empty ok).
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.E2E_API_BASE_URL?.replace(/\/$/, '') || '';

const describeE2E = BASE_URL ? describe : describe.skip;

describeE2E('Art Marketplace E2E API', () => {
  describe('LokKala BFF – artifacts', () => {
    it('GET /api/lokkala/artifacts returns 200 and list shape', async () => {
      const res = await fetch(`${BASE_URL}/api/lokkala/artifacts`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { items?: unknown[]; total?: number; page?: number; pageSize?: number; totalPages?: number };
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof (data.total ?? 0)).toBe('number');
      expect(typeof (data.page ?? 1)).toBe('number');
      expect(typeof (data.pageSize ?? 12)).toBe('number');
    });

    it('GET /api/lokkala/artifacts?page=1&pageSize=2 returns paginated result', async () => {
      const res = await fetch(`${BASE_URL}/api/lokkala/artifacts?page=1&pageSize=2`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { items?: unknown[]; page?: number; pageSize?: number };
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items!.length).toBeLessThanOrEqual(2);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(2);
    });

    it('GET /api/lokkala/artifacts/:id returns 200 for existing or 404 for missing', async () => {
      const listRes = await fetch(`${BASE_URL}/api/lokkala/artifacts?pageSize=1`);
      expect(listRes.status).toBe(200);
      const list = (await listRes.json()) as { items?: { id?: string }[] };
      const firstId = list.items?.[0]?.id;

      if (firstId) {
        const detailRes = await fetch(`${BASE_URL}/api/lokkala/artifacts/${firstId}`);
        expect(detailRes.status).toBe(200);
        const detail = (await detailRes.json()) as { id?: string; title?: string };
        expect(detail.id).toBe(firstId);
      }

      const notFoundRes = await fetch(`${BASE_URL}/api/lokkala/artifacts/non-existent-id-12345`);
      expect(notFoundRes.status).toBe(404);
    });
  });

  describe('Order Service', () => {
    it('GET /api/orders/?userId=test-e2e-user returns 200 and orders array', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/?userId=test-e2e-user`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { orders?: unknown[] };
      expect(Array.isArray(data.orders)).toBe(true);
    });

    it('GET /api/orders/invalid-order-id returns 404', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/non-existent-order-id-12345`);
      expect(res.status).toBe(404);
    });
  });

  describe('App proxy (ALB)', () => {
    it('GET / returns app HTML (200)', async () => {
      const res = await fetch(`${BASE_URL}/`, { redirect: 'follow' });
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toMatch(/<!DOCTYPE html|html|Art Marketplace|root/i);
    });
  });
});
