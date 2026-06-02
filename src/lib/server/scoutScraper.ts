const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const MAILTO_REGEX = /href\s*=\s*["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
const JSONLD_EMAIL_REGEX = /"email"\s*:\s*"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"/gi;
const LINK_CONTACT_REGEX = /href\s*=\s*["']([^"']*(?:contact|nous-contacter|neem-contact)[^"']*)["']/gi;

const EMAIL_BLACKLIST = new Set([
  "example.com", "domain.com", "email.com", "yoursite.com",
  "test.com", "sample.com", "company.com", "sentry.io",
  "wixpress.com", "w3.org", "schema.org", "googleapis.com",
  "cloudfront.net", "wordpress.com", "gravatar.com",
]);

const EMAIL_PREFIX_BLACKLIST = new Set(["u0022", "u0027", "u003c", "u003e", "&quot", "&#39", "&lt", "&gt"]);
const EXT_BLACKLIST = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".pdf", ".css", ".js"]);
const EMAIL_PRIORITY_PREFIXES = ["info@", "contact@", "secretariat@", "accueil@", "admin@", "bureau@", "hello@"];

const CONTACT_PATHS = [
  "/contact", "/fr/contact", "/nl/contact", "/en/contact",
  "/contactez-nous", "/nous-contacter", "/neem-contact-op",
  "/qui-sommes-nous", "/over-ons", "/about", "/a-propos",
  "/mentions-legales", "/legal-notice", "/disclaimer",
  "/footer", "/nous-trouver", "/plan-du-site",
];

function isValidEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  email = email.trim().replace(/\.$/, "");
  for (const ext of EXT_BLACKLIST) {
    if (email.toLowerCase().endsWith(ext)) return false;
  }
  for (const prefix of EMAIL_PREFIX_BLACKLIST) {
    if (email.startsWith(prefix)) return false;
  }
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || EMAIL_BLACKLIST.has(domain)) return false;
  if (domain.endsWith(".png") || domain.endsWith(".jpg") || domain.endsWith(".gif") || domain.endsWith(".svg")) return false;
  if (email.length < 6 || email.length > 80) return false;
  const local = email.split("@")[0]?.toLowerCase();
  if (["noreply", "no-reply", "mailer-daemon", "postmaster", "webmaster", "root", "admin", "wordpress"].includes(local)) return false;
  return true;
}

function deobfuscate(text: string): string {
  const patterns: Array<[RegExp, string]> = [
    [/\s*\[\s*at\s*\]\s*/gi, "@"],
    [/\s*\(at\)\s*/gi, "@"],
    [/\s*\{at\}\s*/gi, "@"],
    [/\s*<at>\s*/gi, "@"],
    [/\s*\[\s*\.\s*\]\s*/gi, "."],
    [/\s*\(\.\)\s*/gi, "."],
    [/\s*\{\.\}\s*/gi, "."],
    [/\s*<dot>\s*/gi, "."],
    [/\s+AT\s+/gi, "@"],
    [/\s+DOT\s+/gi, "."],
    [/&#64;/g, "@"],
    [/&#46;/g, "."],
  ];
  for (const [re, replacement] of patterns) {
    text = text.replace(re, replacement);
  }
  return text;
}

function extractEmails(html: string): Set<string> {
  const decoded = html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const deobfuscated = deobfuscate(decoded);
  const found = new Set<string>();

  for (const m of deobfuscated.matchAll(MAILTO_REGEX)) {
    const e = m[1];
    if (isValidEmail(e)) found.add(e);
  }

  for (const m of deobfuscated.matchAll(JSONLD_EMAIL_REGEX)) {
    const e = m[1];
    if (isValidEmail(e)) found.add(e);
  }

  const textOnly = deobfuscated.replace(/<[^>]+>/g, " ");
  for (const m of textOnly.matchAll(EMAIL_REGEX)) {
    if (isValidEmail(m[0])) found.add(m[0]);
  }

  for (const m of deobfuscated.matchAll(/href="mailto:([^"]+)"/gi)) {
    const addr = decodeURIComponent(m[1]).split("?")[0].trim();
    if (isValidEmail(addr)) found.add(addr);
  }

  return found;
}

function findContactLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  for (const m of html.matchAll(LINK_CONTACT_REGEX)) {
    const href = m[1];
    if (href.startsWith("http")) {
      links.push(href);
    } else if (href.startsWith("/")) {
      const url = new URL(baseUrl);
      links.push(`${url.protocol}//${url.host}${href}`);
    }
  }
  return links.slice(0, 3);
}

function scoreEmail(email: string): number {
  const lower = email.toLowerCase();
  if (EMAIL_PRIORITY_PREFIXES.some((p) => lower.startsWith(p))) return 0;
  const local = lower.split("@")[0];
  if (["info", "contact", "accueil", "bureau", "admin", "hello"].some((k) => local.includes(k))) return 1;
  const domain = lower.split("@")[1];
  if (["gmail", "hotmail", "outlook", "yahoo", "skynet"].some((k) => domain.includes(k))) return 3;
  return 2;
}

export async function scrapeEmails(website: string): Promise<string[]> {
  if (!website) return [];
  if (!website.startsWith("http")) website = "https://" + website;
  website = website.replace(/\/$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(website, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-BE,fr;q=0.9,nl-BE;q=0.8,en;q=0.7",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const html = await res.text();
    const allEmails = extractEmails(html);

    if (allEmails.size === 0) {
      // Try contact links
      const contactLinks = findContactLinks(html, website);
      for (const link of contactLinks) {
        try {
          const cRes = await fetch(link, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            signal: controller.signal,
          });
          if (cRes.ok) {
            const cHtml = await cRes.text();
            const cEmails = extractEmails(cHtml);
            for (const e of cEmails) allEmails.add(e);
            if (allEmails.size > 0) break;
          }
        } catch {
          // ignore
        }
      }
    }

    if (allEmails.size === 0) {
      // Try common contact paths
      for (const suffix of CONTACT_PATHS) {
        try {
          const cRes = await fetch(website + suffix, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            signal: controller.signal,
          });
          if (cRes.ok) {
            const cHtml = await cRes.text();
            const cEmails = extractEmails(cHtml);
            for (const e of cEmails) allEmails.add(e);
            if (allEmails.size > 0) break;
          }
        } catch {
          // ignore
        }
      }
    }

    const sorted = Array.from(allEmails).sort((a, b) => scoreEmail(a) - scoreEmail(b));
    return sorted;
  } catch {
    return [];
  }
}
