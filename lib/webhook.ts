import { WEBHOOK_TIMEOUT_MS } from "@/lib/constants";

// Server-only: the webhook URL must never reach the browser.
export async function notifyHomeAssistant(
  userName: string,
  drink: string,
): Promise<boolean> {
  const url = process.env.HOME_ASSISTANT_WEBHOOK_URL;
  if (!url) {
    console.error("HOME_ASSISTANT_WEBHOOK_URL is not configured");
    return false;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName, drink }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`Home Assistant webhook responded ${response.status}`);
    }
    return response.ok;
  } catch (error) {
    console.error(
      "Home Assistant webhook failed:",
      error instanceof Error ? error.name : "unknown error",
    );
    return false;
  }
}
