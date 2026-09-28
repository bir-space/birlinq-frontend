/** `{ field: message }` — what a form can pin under its inputs. */
export type FieldErrors = Record<string, string>;

/**
 * Flatten `VALIDATION_ERROR` details (`{ field: ["msg", ...] }` from Laravel)
 * into a `{ field: message }` map for inline display.
 *
 * The one implementation for every client: the web's auth helpers re-export
 * it, and the hooks below hand its result back as `fieldErrors` so a view
 * never parses `details` itself. Nested keys (`contact.display_name`,
 * `socials.0.url`) are kept whole *and* under their last segment, so a form
 * can look up `display_name` without knowing how the request was nested.
 */
export function detailsToFieldErrors(
  details?: Record<string, unknown>
): FieldErrors {
  const out: FieldErrors = {};
  if (!details) return out;
  for (const [key, value] of Object.entries(details)) {
    const short = key.split(".").pop() ?? key;
    let message: string | null = null;
    if (typeof value === "string") message = value;
    else if (Array.isArray(value) && typeof value[0] === "string")
      message = value[0];
    if (message) {
      out[key] = message;
      out[short] = message;
    }
  }
  return out;
}
