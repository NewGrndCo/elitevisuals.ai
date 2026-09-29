const canonicalOrigin = "https://elitevisualsai.netlify.app";

export function getMemberOrigin(configuredValue = process.env.NEXT_PUBLIC_SITE_URL) {
  const configured = configuredValue?.trim();
  if (!configured) return canonicalOrigin;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" || url.username || url.password) return canonicalOrigin;
    if (url.hostname === "elitevisualsai.netlify.app" || url.hostname === "elitevisuals.ai") {
      return url.origin;
    }
  } catch {
    // Fall back to the known production origin below.
  }
  return canonicalOrigin;
}
