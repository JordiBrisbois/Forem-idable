import { randomInt } from "crypto";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const SYMBOLS = "!@#$%*?";

/**
 * Human-friendly temporary password for admin-created accounts. Ambiguous
 * characters (0/O, 1/l/I) are excluded to ease manual sharing.
 */
export function generateTemporaryPassword(length = 14): string {
  const size = Math.max(length, 10);
  const chars: string[] = [];

  for (let index = 0; index < size - 2; index += 1) {
    chars.push(LETTERS[randomInt(LETTERS.length)]);
  }
  chars.push(SYMBOLS[randomInt(SYMBOLS.length)]);
  chars.push(LETTERS[randomInt(LETTERS.length)]);

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }

  return chars.join("");
}
