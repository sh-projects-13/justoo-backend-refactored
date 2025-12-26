
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { customerSessions, customers, phoneWhitelist } from "../../db/schema.js";
import { customerOtp } from "../../utils/customerOtp.js";

const OTP_TTL_MS = Number(process.env.CUSTOMER_OTP_TTL_MS || 1000 * 60 * 5);
const JWT_TTL = process.env.CUSTOMER_JWT_TTL || "7d";

const otpStore = new Map();
function tokenToHash(token) {
    return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function normalizePhone(phone) {
    return String(phone || "").trim();
}

function requireJwtSecret() {
    const secret = process.env.CUSTOMER_JWT_SECRET || "dev-customer-jwt-secret";
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && secret === "dev-customer-jwt-secret") {
        throw new Error("CUSTOMER_JWT_SECRET is required in production");
    }
    return secret;
}

function extractBearerToken(req) {
    const header = String(req.headers?.authorization || "");
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) return null;
    return token;
}

function isPhoneWhitelistedRow(row) {
    return Boolean(row?.phone);
}

export async function sendOtp(req, res, next) {
    try {
        const phone = normalizePhone(req.body?.phone);
        if (!phone) return res.status(400).json({ error: "PHONE_REQUIRED" });

        const wlRows = await db
            .select({ phone: phoneWhitelist.phone })
            .from(phoneWhitelist)
            .where(eq(phoneWhitelist.phone, phone))
            .limit(1);

        if (!isPhoneWhitelistedRow(wlRows[0])) {
            return res.status(403).json({ error: "PHONE_NOT_WHITELISTED" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = Date.now() + OTP_TTL_MS;

        otpStore.set(phone, {
            otp,
            expiresAt,
            used: false,
        });

        customerOtp(phone, otp);

        return res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

export async function verifyOtp(req, res, next) {
    try {
        const phone = normalizePhone(req.body?.phone);
        const otp = String(req.body?.otp || "").trim();

        if (!phone || !otp) {
            return res.status(400).json({ error: "PHONE_AND_OTP_REQUIRED" });
        }

        const entry = otpStore.get(phone);
        if (!entry) return res.status(401).json({ error: "OTP_INVALID" });

        if (entry.used) {
            otpStore.delete(phone);
            return res.status(401).json({ error: "OTP_INVALID" });
        }

        if (Date.now() > entry.expiresAt) {
            otpStore.delete(phone);
            return res.status(401).json({ error: "OTP_EXPIRED" });
        }

        if (entry.otp !== otp) {
            return res.status(401).json({ error: "OTP_INVALID" });
        }

        entry.used = true;
        otpStore.delete(phone);

        const customerRows = await db
            .select({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                email: customers.email,
                createdAt: customers.createdAt,
            })
            .from(customers)
            .where(eq(customers.phone, phone))
            .limit(1);

        const customer = customerRows[0];
        if (!customer) {
            return res.status(404).json({ error: "CUSTOMER_NOT_FOUND" });
        }

        const jti = crypto.randomUUID();
        const secret = requireJwtSecret();
        const token = jwt.sign(
            {
                sub: customer.id,
                phone: customer.phone,
                jti,
                typ: "customer",
            },
            secret,
            { expiresIn: JWT_TTL }
        );

        const decoded = jwt.decode(token);
        const exp = decoded?.exp;
        if (!exp) {
            return res.status(500).json({ error: "TOKEN_CREATE_FAILED" });
        }

        const tokenHash = tokenToHash(token);
        const expiresAt = new Date(Number(exp) * 1000);

        await db
            .insert(customerSessions)
            .values({
                customerId: customer.id,
                tokenHash,
                expiresAt,
            })
            .onConflictDoNothing({ target: customerSessions.tokenHash });

        return res.json({
            token,
            customer,
        });
    } catch (err) {
        next(err);
    }
}

export async function logout(req, res, next) {
    try {
        const token = extractBearerToken(req);
        if (!token) return res.status(401).json({ error: "TOKEN_REQUIRED" });

        const secret = requireJwtSecret();
        let payload;
        try {
            payload = jwt.verify(token, secret);
        } catch {
            return res.status(401).json({ error: "TOKEN_INVALID" });
        }

        if (payload?.typ !== "customer") {
            return res.status(401).json({ error: "TOKEN_INVALID" });
        }

        const tokenHash = tokenToHash(token);
        await db.delete(customerSessions).where(eq(customerSessions.tokenHash, tokenHash));
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function revokeToken(req, res, next) {
    return logout(req, res, next);
}


