function toCsvString(value: unknown) {
  if (value == null) return "";
  return String(value);
}

export function neutralizeSpreadsheetFormula(value: string) {
  if (!value) return value;
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export function escapeCsvCell(value: unknown) {
  const stringValue = toCsvString(value);
  return `"${neutralizeSpreadsheetFormula(stringValue).replace(/"/g, '""').replace(/\n/g, " ")}"`;
}
