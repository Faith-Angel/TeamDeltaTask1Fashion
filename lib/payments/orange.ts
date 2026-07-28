/**
 * lib/payments/orange.ts
 *
 * Orange Money Cameroon payment API client.
 *
 * Docs: https://developer.orange.com/apis/orange-money-webpay-cm/
 *
 * Flow (Orange Money Web Payment):
 *   1. Get access token via client_credentials OAuth
 *   2. Initiate payment → provider returns a payment URL or reference
 *   3. Provider processes → sends webhook to /api/payments/callback
 *   4. We verify and update the order
 */

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.ORANGE_MONEY_ENVIRONMENT === "production"
    ? "https://api.orange.com/orange-money-webpay/cm/v1"
    : "https://api.orange.com/orange-money-webpay/dev/v1";

const CLIENT_ID     = process.env.ORANGE_MONEY_CLIENT_ID!;
const CLIENT_SECRET = process.env.ORANGE_MONEY_CLIENT_SECRET!;
const CALLBACK_URL  = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`;
const CURRENCY      = "XAF";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrangeInitiateParams {
  amountXAF:  number;
  orderId:    string;  // our Order.id used as merchant_key
  notifUrl:   string;  // callback URL
  returnUrl:  string;  // redirect after payment (PWA deep-link)
  cancelUrl:  string;
  payerPhone: string;
}

export interface OrangeInitiateResult {
  accepted:       boolean;
  paymentUrl?:    string;
  payToken?:      string;
  error?:         string;
}

export interface OrangePaymentStatus {
  status:  "SUCCESS" | "FAILED" | "PENDING" | "EXPIRED";
  txnId?:  string;
  message?: string;
}

// ── Access token (cached in module scope for the process lifetime) ─────────────

let cachedToken: string | null    = null;
let tokenExpiresAt: number        = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://api.orange.com/oauth/v3/token", {
    method:  "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type":  "application/x-www-form-urlencoded",
      "Accept":        "application/json",
    },
    body:   "grant_type=client_credentials",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Orange Money token request failed: ${response.status}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken      = data.access_token;
  tokenExpiresAt   = Date.now() + (data.expires_in - 60) * 1000; // refresh 60s early
  return cachedToken;
}

// ── Initiate payment ──────────────────────────────────────────────────────────

export async function orangeInitiatePayment(
  params: OrangeInitiateParams
): Promise<OrangeInitiateResult> {
  try {
    const token = await getAccessToken();

    const body = {
      merchant_key:   params.orderId,
      currency:       CURRENCY,
      order_id:       params.orderId,
      amount:         params.amountXAF,
      return_url:     params.returnUrl,
      cancel_url:     params.cancelUrl,
      notif_url:      CALLBACK_URL,
      lang:           "en",
      reference:      params.orderId,
    };

    const response = await fetch(`${BASE_URL}/webpayment`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
        "Accept":        "application/json",
      },
      body:   JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { accepted: false, error: `Orange returned ${response.status}: ${text}` };
    }

    const data = await response.json() as {
      payment_url?: string;
      pay_token?:   string;
      message?:     string;
    };

    return {
      accepted:   true,
      paymentUrl: data.payment_url,
      payToken:   data.pay_token,
    };
  } catch (err) {
    return {
      accepted: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Check payment status ──────────────────────────────────────────────────────

export async function orangeGetPaymentStatus(
  payToken: string
): Promise<OrangePaymentStatus> {
  try {
    const token = await getAccessToken();

    const response = await fetch(`${BASE_URL}/webpayment/${payToken}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept":        "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return { status: "FAILED", message: `Orange status check returned ${response.status}` };
    }

    const data = await response.json() as {
      status:   string;
      txnid?:   string;
      message?: string;
    };

    const statusMap: Record<string, OrangePaymentStatus["status"]> = {
      SUCCESS: "SUCCESS",
      FAILED:  "FAILED",
      PENDING: "PENDING",
      EXPIRED: "EXPIRED",
    };

    return {
      status:  statusMap[data.status] ?? "FAILED",
      txnId:   data.txnid,
      message: data.message,
    };
  } catch (err) {
    return { status: "FAILED", message: err instanceof Error ? err.message : String(err) };
  }
}
