export type Lifecycle = { is_published?: unknown; archived_at?: unknown; publish_at?: unknown };
export function isVisible(row: Lifecycle, defaultPublished = false, now = Date.now()) {
  if (row.archived_at) return false;
  if (!(row.is_published ?? defaultPublished)) return false;
  if (!row.publish_at) return true;
  const date = Date.parse(String(row.publish_at));
  return Number.isFinite(date) && date <= now;
}
export function safeUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !/[\\\s]/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function safeDestination(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\r\n]/.test(value)
    ? value
    : "/promptbox";
}
