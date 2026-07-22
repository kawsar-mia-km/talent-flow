/**
 * The server's validate.js middleware returns errors as an array of
 * "field: message" strings (see server/middleware/validate.js). This
 * turns that into a { field: message } map so forms can show the error
 * right under the input that caused it, instead of one generic banner.
 */
export function parseFieldErrors(err) {
  const list = err?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  const map = {};
  for (const item of list) {
    const idx = item.indexOf(":");
    if (idx === -1) continue;
    const field = item.slice(0, idx).trim();
    const message = item.slice(idx + 1).trim();
    if (!map[field]) map[field] = message; // keep the first error per field
  }
  return map;
}

export function getGenericMessage(err, fallback) {
  return err?.response?.data?.message || fallback;
}
