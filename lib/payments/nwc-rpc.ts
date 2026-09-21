// Shared low-level NWC (NIP-47) request/response client. Used by the
// Alby Hub PaymentRail (alby.ts) to call make_invoice/lookup_invoice/
// pay_invoice against OUR OWN wallet — unlike nwc.ts's requestWalletPayment,
// which fires a pay_invoice request at a BUYER's wallet and deliberately
// never waits for a response (see that file for why). Here we need the
// actual result, since the marketplace can't generate an invoice without one.
//
// Nostr-tools@2.25.2 ships nip47.ts but doesn't export it (see nwc.ts) —
// this module is built from the same already-exported primitives
// (nip04, nip44, pure, kinds, pool), just extended to also decrypt a
// wallet's response rather than only encrypt a request.

import { hexToBytes } from "@noble/hashes/utils.js";
import { encrypt as nip04Encrypt, decrypt as nip04Decrypt } from "nostr-tools/nip04";
import { getConversationKey, encrypt as nip44Encrypt, decrypt as nip44Decrypt } from "nostr-tools/nip44";
import { finalizeEvent, type EventTemplate } from "nostr-tools/pure";
import { NWCWalletRequest, NWCWalletResponse, NWCWalletInfo } from "nostr-tools/kinds";
import { SimplePool } from "nostr-tools/pool";

const REQUEST_TIMEOUT_MS = 15000;
const INFO_EVENT_TIMEOUT_MS = 5000;

type Encryption = "nip44_v2" | "nip04";

type NwcConnection = {
  pubkey: string;
  relays: string[];
  secretBytes: Uint8Array;
};

function parseNwcConnectionString(connectionString: string): NwcConnection {
  const { host, pathname, searchParams } = new URL(connectionString);
  const pubkey = pathname.replace(/^\/\//, "") || host;
  const relays = searchParams.getAll("relay");
  const secret = searchParams.get("secret");
  if (!pubkey || relays.length === 0 || !secret) {
    throw new Error("invalid NWC connection string — expected a nostr+walletconnect:// URI");
  }
  return { pubkey, relays, secretBytes: hexToBytes(secret) };
}

async function negotiateEncryption(pool: SimplePool, conn: NwcConnection): Promise<Encryption> {
  const info = await pool.get(
    conn.relays,
    { kinds: [NWCWalletInfo], authors: [conn.pubkey] },
    { maxWait: INFO_EVENT_TIMEOUT_MS }
  );
  const encryptionTag = info?.tags.find((t) => t[0] === "encryption")?.[1];
  // Per NIP-47: absence of the tag means the wallet only supports nip04.
  return encryptionTag?.includes("nip44_v2") ? "nip44_v2" : "nip04";
}

function encryptFor(scheme: Encryption, conn: NwcConnection, plaintext: string): string {
  if (scheme === "nip44_v2") {
    return nip44Encrypt(plaintext, getConversationKey(conn.secretBytes, conn.pubkey));
  }
  return nip04Encrypt(conn.secretBytes, conn.pubkey, plaintext);
}

function decryptFor(scheme: Encryption, conn: NwcConnection, ciphertext: string): string {
  if (scheme === "nip44_v2") {
    return nip44Decrypt(ciphertext, getConversationKey(conn.secretBytes, conn.pubkey));
  }
  return nip04Decrypt(conn.secretBytes, conn.pubkey, ciphertext);
}

export type NwcRpcResult = { result: Record<string, unknown> } | { error: { code: string; message: string } };

// Requires the wallet (e.g. Alby Hub) to be running and connected to its
// relay at call time — unlike an always-on hosted rail, there's a live
// party on the other end of this request.
export async function callNwcMethod(
  connectionString: string,
  method: string,
  params: Record<string, unknown>
): Promise<NwcRpcResult> {
  const conn = parseNwcConnectionString(connectionString);
  const pool = new SimplePool();
  try {
    const scheme = await negotiateEncryption(pool, conn);
    const content = encryptFor(scheme, conn, JSON.stringify({ method, params }));
    const eventTemplate: EventTemplate = {
      kind: NWCWalletRequest,
      created_at: Math.round(Date.now() / 1000),
      content,
      tags: [
        ["p", conn.pubkey],
        ["encryption", scheme],
      ],
    };
    const requestEvent = finalizeEvent(eventTemplate, conn.secretBytes);

    // pool.get() resolves on each relay's first EOSE rather than actually
    // waiting live for an event that doesn't exist yet — fine for the info
    // event above (already stored), useless for a response that's only
    // published *after* this request goes out. Subscribe first (so nothing
    // is missed), then publish, and race the subscription against a timer.
    const responseEvent = await new Promise<import("nostr-tools/pure").Event | null>((resolve) => {
      let settled = false;
      const sub = pool.subscribeMany(
        conn.relays,
        { kinds: [NWCWalletResponse], authors: [conn.pubkey], "#e": [requestEvent.id] },
        {
          onevent(event) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            sub.close();
            resolve(event);
          },
        }
      );
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        sub.close();
        resolve(null);
      }, REQUEST_TIMEOUT_MS);
      pool.publish(conn.relays, requestEvent);
    });
    if (!responseEvent) {
      return {
        error: {
          code: "TIMEOUT",
          message: `no response from wallet within ${REQUEST_TIMEOUT_MS}ms — is it online and connected to its relay?`,
        },
      };
    }

    const decrypted = decryptFor(scheme, conn, responseEvent.content);
    const parsed = JSON.parse(decrypted);
    if (parsed.error) return { error: parsed.error };
    return { result: parsed.result };
  } finally {
    pool.close(conn.relays);
  }
}
