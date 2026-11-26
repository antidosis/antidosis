/**
 * Narrow an unknown caught error into the fields Twilio errors carry,
 * without `any`. Non-Twilio errors yield "unknown" markers.
 */
export interface TwilioErrorInfo {
  message: string;
  code: number | string;
  status: number | string;
}

export function twilioErrInfo(err: unknown): TwilioErrorInfo {
  if (err && typeof err === "object") {
    const record = err as Record<string, unknown>;
    return {
      message: typeof record.message === "string" ? record.message : String(err),
      code:
        typeof record.code === "number" || typeof record.code === "string"
          ? record.code
          : "unknown",
      status:
        typeof record.status === "number" || typeof record.status === "string"
          ? record.status
          : "unknown",
    };
  }
  return { message: String(err), code: "unknown", status: "unknown" };
}
