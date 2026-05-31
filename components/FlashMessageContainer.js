import { getFlash } from "@/lib/flash";
import FlashMessageClient from "./FlashMessageClient";

export default async function FlashMessageContainer() {
  const flash = await getFlash();

  if (!flash) return null;

  return <FlashMessageClient flashData={flash} />;
}
