import { WEBHOOK_TIMEOUT_MS } from "@/lib/constants";

// Server-only: the webhook URL must never reach the browser (nor the logs).
function describeError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown error";
  const cause = error.cause as { code?: string; message?: string } | undefined;
  const detail = cause?.code ?? cause?.message;
  return detail ? `${error.name}: ${error.message} (${detail})` : `${error.name}: ${error.message}`;
}

export async function notifyHomeAssistant(
  userName: string,
  drink: string,
): Promise<boolean> {
  // Tolerate surrounding whitespace/quotes copied into the env variable.
  const url = process.env.HOME_ASSISTANT_WEBHOOK_URL?.trim().replace(/^["']|["']$/g, "");
  if (!url) {
    console.error("HOME_ASSISTANT_WEBHOOK_URL is not configured");
    return false;
  }

  try {
    const { protocol } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") throw new Error(`unsupported protocol ${protocol}`);
  } catch {
    console.error(
      "HOME_ASSISTANT_WEBHOOK_URL is not a valid http(s) URL (expected e.g. https://host/api/webhook/<id>)",
    );
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
    console.error("Home Assistant webhook failed:", describeError(error));
    return false;
  }
}
