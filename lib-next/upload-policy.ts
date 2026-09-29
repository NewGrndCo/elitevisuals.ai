export const CHUNK_SIZE = 4 * 1024 * 1024;
export const FILE_LIMIT = 18 * 1024 * 1024;
export const UPLOAD_KINDS = [
  "prompt-cover",
  "prompt-demo",
  "skill-cover",
  "skill-package",
  "resource-image",
  "site-asset",
] as const;
export const imageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];
export const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
export function fileError(kind: string, name: string, type: string, size: number) {
  if (!(UPLOAD_KINDS as readonly string[]).includes(kind)) return "Unsupported upload type.";
  if (!size || size > FILE_LIMIT) return "Choose a non-empty file of 18 MB or smaller.";
  const zip =
    name.toLowerCase().endsWith(".zip") &&
    ["application/zip", "application/x-zip-compressed", "application/octet-stream", ""].includes(
      type,
    );
  if (kind === "skill-package") return zip ? "" : "Choose a ZIP package.";
  if (kind === "prompt-demo")
    return videoTypes.includes(type) ? "" : "Choose an MP4, WebM or MOV video.";
  if (kind === "site-asset")
    return imageTypes.includes(type) ||
      videoTypes.includes(type) ||
      (type === "application/pdf" && name.toLowerCase().endsWith(".pdf"))
      ? ""
      : "Choose a PNG, JPEG, WebP, GIF, AVIF, MP4, WebM, MOV or PDF. Upload skill ZIPs in the skill editor.";
  return imageTypes.includes(type) ? "" : "Choose a PNG, JPEG, WebP, GIF or AVIF image.";
}
export function matchesSignature(bytes: Uint8Array, type: string, kind: string) {
  const at = (offset: number, text: string) =>
    [...text].every((c, i) => bytes[offset + i] === c.charCodeAt(0));
  if (kind === "skill-package")
    return (
      at(0, "PK") && ((bytes[2] === 3 && bytes[3] === 4) || (bytes[2] === 5 && bytes[3] === 6))
    );
  if (type === "image/png") return bytes[0] === 137 && at(1, "PNG\r\n\x1a\n");
  if (type === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/gif") return at(0, "GIF87a") || at(0, "GIF89a");
  if (type === "image/webp") return at(0, "RIFF") && at(8, "WEBP");
  if (type === "image/avif") return at(4, "ftyp") && (at(8, "avif") || at(8, "avis"));
  if (type === "video/webm")
    return bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163;
  if (["video/mp4", "video/quicktime"].includes(type)) return at(4, "ftyp");
  if (type === "application/pdf") return at(0, "%PDF-");
  return false;
}
