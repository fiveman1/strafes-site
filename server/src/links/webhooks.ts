import { createHmac, randomUUID } from "crypto";
import { ApiKey, LinkRequest } from "./db.js";

// Waits before each try. Network errors, 429 and 5xx are tried again; anything else is the receiver saying no.
const RETRY_DELAYS_MS = [0, 5_000, 30_000, 120_000];
const TIMEOUT_MS = 5_000;

export type WebhookEventType = "link.completed";

export interface WebhookEvent {
    id: string
    type: WebhookEventType
    createdAt: string
    data: LinkRequest
}

/**
 * The X-Strafes-Signature header: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<body>" with the webhook secret>.
 * Receivers should check it, and that t is recent, before trusting the body.
 */
export function signWebhook(secret: string, timestamp: number, body: string) {
    const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    return `t=${timestamp},v1=${signature}`;
}

/** Sends the event to the key's webhook, if it has one. Doesn't wait for it, and never throws. */
export function sendWebhook(apiKey: ApiKey, type: WebhookEventType, data: LinkRequest) {
    const { webhookUrl, webhookSecret } = apiKey;
    if (!webhookUrl || !webhookSecret) {
        return;
    }

    const event: WebhookEvent = {
        id: randomUUID(),
        type: type,
        createdAt: new Date().toISOString(),
        data: data
    };
    const body = JSON.stringify(event);

    deliver(webhookUrl, webhookSecret, event, body).catch((err) => {
        console.error(`Webhook ${event.id} to API key ${apiKey.id} failed:`, err);
    });
}

async function deliver(url: string, secret: string, event: WebhookEvent, body: string) {
    let lastError = "";
    for (const delay of RETRY_DELAYS_MS) {
        if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        try {
            // Signed per try, so a retry isn't turned away as too old
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "strafes-webhooks/1.0",
                    "X-Strafes-Event": event.type,
                    "X-Strafes-Delivery": event.id,
                    "X-Strafes-Signature": signWebhook(secret, Math.floor(Date.now() / 1000), body)
                },
                body: body,
                signal: AbortSignal.timeout(TIMEOUT_MS),
                redirect: "error"
            });
            if (res.ok) {
                return;
            }
            lastError = `status ${res.status}`;
            if (res.status < 500 && res.status !== 429) {
                break;
            }
        }
        catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
        }
    }
    throw new Error(`giving up after ${lastError}`);
}
