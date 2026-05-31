// lib/whatsapp.js
// Single helper for sending WhatsApp messages.
// Per-school config comes from that school's own .env (single-tenant).
// Designed for Meta WhatsApp Cloud API. If you switch BSP later,
// only this file changes — the rest of the app keeps calling sendWhatsApp().

// Required env (per school):
//   WHATSAPP_TOKEN          = permanent access token
//   WHATSAPP_PHONE_ID       = phone number id from Meta
//   WHATSAPP_API_VERSION    = e.g. v21.0  (optional, defaults below)
//
// If WHATSAPP_TOKEN or WHATSAPP_PHONE_ID is missing, sending is skipped
// silently (returns false) so dev/demo never crashes.

function normalizePhone(raw) {
  if (!raw) return null;
  // keep digits only
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  // strip leading 0
  if (digits.startsWith("0")) digits = digits.slice(1);
  // add India country code if a bare 10-digit number
  if (digits.length === 10) digits = "91" + digits;
  return digits;
}

export async function sendWhatsApp(phone, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";

  if (!token || !phoneId) {
    console.warn("[whatsapp] skipped — WHATSAPP_TOKEN / WHATSAPP_PHONE_ID missing");
    return false;
  }

  const to = normalizePhone(phone);
  if (!to) {
    console.warn("[whatsapp] skipped — invalid phone:", phone);
    return false;
  }

  const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[whatsapp] send failed:", res.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[whatsapp] send error:", err);
    return false;
  }
}