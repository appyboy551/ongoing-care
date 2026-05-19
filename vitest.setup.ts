// Test environment: deterministic encryption key, deterministic timezone hints.
import { randomBytes } from "crypto";

process.env.PORTAL_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.ADMIN_EMAIL = "test@example.com";
process.env.APP_URL = "http://localhost:3001";
