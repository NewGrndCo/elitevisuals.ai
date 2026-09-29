import { fields, type Table } from "./cms-model";
import { safeUrl } from "./content-policy";

export class InputError extends Error {}
export function validateContent(table: string, input: unknown, partial = false) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new InputError("Invalid content data.");
  const definitions = fields[table as Table];
  if (!definitions?.length) throw new InputError("This content type is read-only.");
  const values = input as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (key === "archived_at") {
      if (value !== null && (typeof value !== "string" || !Number.isFinite(Date.parse(value))))
        throw new InputError("Invalid archive date.");
      result[key] = value;
      continue;
    }
    const field = definitions.find((f) => f.key === key);
    if (!field) throw new InputError(`Unsupported field: ${key}`);
    if (field.type === "boolean") {
      if (typeof value !== "boolean") throw new InputError(`${field.label} must be true or false.`);
    } else if (field.type === "number") {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        !Number.isInteger(value) ||
        Math.abs(value) > 1e9 ||
        (key === "price_cents" && value < 0)
      )
        throw new InputError(`${field.label} must be a valid whole number.`);
    } else if (field.type === "datetime") {
      if (value !== null && (typeof value !== "string" || !Number.isFinite(Date.parse(value))))
        throw new InputError(`${field.label} must be a valid date.`);
    } else if (["gallery_urls", "tags", "compatibility"].includes(key)) {
      if (
        !Array.isArray(value) ||
        value.length > 100 ||
        value.some(
          (v) =>
            typeof v !== "string" || v.length > 2048 || (key === "gallery_urls" && !safeUrl(v)),
        )
      )
        throw new InputError(`${field.label} contains invalid entries.`);
    } else if (field.type === "json") {
      if (!value || typeof value !== "object" || JSON.stringify(value).length > 100000)
        throw new InputError(`${field.label} must be valid JSON.`);
    } else {
      if (value !== null && (typeof value !== "string" || value.length > 100000))
        throw new InputError(`${field.label} is invalid or too long.`);
      if (
        typeof value === "string" &&
        value &&
        (key === "url" || key.endsWith("_url")) &&
        !safeUrl(value)
      )
        throw new InputError(`${field.label} must use HTTPS or a local path.`);
      if (
        key === "slug" &&
        (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(value))
      )
        throw new InputError("Use letters, numbers, hyphens and underscores in the slug.");
      if (
        key === "email" &&
        (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      )
        throw new InputError("Enter a valid email address.");
    }
    if (field.required && (value == null || (typeof value === "string" && !value.trim())))
      throw new InputError(`${field.label} is required.`);
    result[key] = value;
  }
  if (!partial)
    for (const field of definitions)
      if (field.required && !(field.key in result))
        throw new InputError(`${field.label} is required.`);
  return result;
}
