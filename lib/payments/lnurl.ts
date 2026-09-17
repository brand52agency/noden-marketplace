// Resolves a Lightning Address (user@domain) to a payable bolt11
// invoice via LNURL-pay, so payOut() can send to a seller's registered
// address rather than requiring them to submit a fresh invoice per
// payout. Falls through untouched if `destination` is already a raw
// bolt11 invoice (starts with "lnbc"/"lntb"/"lnbcrt").

export function looksLikeLightningAddress(destination: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination);
}

export async function resolveLightningAddress(address: string, amountSats: number): Promise<string> {
  const [user, domain] = address.split("@");
  const lnurlpUrl = `https://${domain}/.well-known/lnurlp/${user}`;

  const metaRes = await fetch(lnurlpUrl);
  if (!metaRes.ok) {
    throw new Error(`could not resolve Lightning Address ${address}`);
  }
  const meta = await metaRes.json();
  if (meta.tag !== "payRequest" || !meta.callback) {
    throw new Error(`${address} does not support LNURL-pay`);
  }

  const amountMsats = amountSats * 1000;
  if (amountMsats < meta.minSendable || amountMsats > meta.maxSendable) {
    throw new Error(
      `${address} accepts ${meta.minSendable / 1000}-${meta.maxSendable / 1000} sats, got ${amountSats}`
    );
  }

  const sep = meta.callback.includes("?") ? "&" : "?";
  const invoiceRes = await fetch(`${meta.callback}${sep}amount=${amountMsats}`);
  if (!invoiceRes.ok) {
    throw new Error(`LNURL-pay callback failed for ${address}`);
  }
  const invoiceData = await invoiceRes.json();
  if (!invoiceData.pr) {
    throw new Error(`LNURL-pay callback for ${address} returned no invoice`);
  }
  return invoiceData.pr as string;
}
