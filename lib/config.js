export const MASTER_USER_ID = parseInt(process.env.MASTER_USER_ID || "2");

export const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);