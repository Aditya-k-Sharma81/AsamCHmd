import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me-in-production';
const KEY = new TextEncoder().encode(JWT_SECRET);

/**
 * Hashes a plain-text password using bcryptjs
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compares a plain-text password with a hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a payload into a JWT session token
 */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(KEY);
}

/**
 * Verifies a JWT session token
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, KEY);
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Helper to retrieve session from cookie store (which is async in Next.js 15/16)
 */
export async function getSession(cookieStore) {
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}
