// src/lib/i18n/server.ts
// Server-side locale detection from the autokos_lang cookie.
// The cookie is set by the client-side LanguageProvider whenever the user
// switches language, so server-rendered DB content can match the user's preference.
import { cookies } from "next/headers";

const COOKIE_KEY = "autokos_lang";

export async function getServerLocale(): Promise<"en" | "al"> {
  const store = await cookies();
  const val = store.get(COOKIE_KEY)?.value;
  return val === "al" ? "al" : "en";
}
