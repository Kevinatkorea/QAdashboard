import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Verify a password against the instructor password stored in env.
 */
export function verifyInstructorPassword(password: string): boolean {
  const instructorPassword = process.env.INSTRUCTOR_PASSWORD;
  if (!instructorPassword) {
    throw new Error("INSTRUCTOR_PASSWORD environment variable is not set");
  }
  return password === instructorPassword;
}

/**
 * Hash a plaintext password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
