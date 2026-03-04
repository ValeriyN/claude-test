// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ set: mockCookieSet })),
}));

beforeEach(() => {
  mockCookieSet.mockClear();
});

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

test("createSession sets an httpOnly cookie named auth-token", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-123", "test@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();
  const [cookieName, , cookieOptions] = mockCookieSet.mock.calls[0];
  expect(cookieName).toBe("auth-token");
  expect(cookieOptions.httpOnly).toBe(true);
});

test("createSession cookie contains a valid signed JWT", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-123", "test@example.com");

  const token = mockCookieSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("createSession JWT expires in approximately 7 days", async () => {
  const before = Date.now();
  const { createSession } = await import("@/lib/auth");
  await createSession("user-123", "test@example.com");

  const token = mockCookieSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const expectedExpiry = before + sevenDaysMs;

  expect(payload.exp! * 1000).toBeGreaterThanOrEqual(expectedExpiry - 5000);
  expect(payload.exp! * 1000).toBeLessThanOrEqual(expectedExpiry + 5000);
});

test("createSession cookie has sameSite lax and path /", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-123", "test@example.com");

  const cookieOptions = mockCookieSet.mock.calls[0][2];
  expect(cookieOptions.sameSite).toBe("lax");
  expect(cookieOptions.path).toBe("/");
});

test("createSession cookie expires attribute matches the 7-day window", async () => {
  const before = Date.now();
  const { createSession } = await import("@/lib/auth");
  await createSession("user-123", "test@example.com");

  const cookieOptions = mockCookieSet.mock.calls[0][2];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(cookieOptions.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(cookieOptions.expires.getTime()).toBeLessThanOrEqual(before + sevenDaysMs + 1000);
});

test("createSession cookie is not secure outside production", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-123", "test@example.com");

  const cookieOptions = mockCookieSet.mock.calls[0][2];
  expect(cookieOptions.secure).toBe(false);
});
