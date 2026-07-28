/**
 * lib/inngest/client.ts
 *
 * Inngest client singleton for NdoloStitch.
 *
 * This client is used to:
 *   - Define background job functions (send notifications, update rankings, etc.)
 *   - Send events that trigger those functions
 *
 * The client is created once and imported wherever events need to be sent
 * or functions need to be defined.
 *
 * Usage — sending an event from an API route:
 *   import { inngest } from "@/lib/inngest/client";
 *   await inngest.send({ name: "order/payment.confirmed", data: { orderId } });
 *
 * Usage — defining a function (in lib/inngest/functions/):
 *   import { inngest } from "@/lib/inngest/client";
 *   export const myFn = inngest.createFunction(
 *     { id: "my-function" },
 *     { event: "order/payment.confirmed" },
 *     async ({ event, step }) => { ... }
 *   );
 */

import { Inngest } from "inngest";

// ── Inngest client ─────────────────────────────────────────────────────────────

export const inngest = new Inngest({
  id: "ndolostitch",
  name: "NdoloStitch",
});
