/** Parses a route id param (e.g. `[groupId]`, `[userId]`, `[applicationId]`). */
export function parseRouteId(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}
