import { describe, expect, it } from "vitest";
import type { Job } from "@/types/job";
import { buildJobAlertEmail, buildUnsubscribeUrl } from "./email";

const offer: Job = {
  id: "1",
  title: "Développeur <React>",
  company: "ACME & Co",
  location: "Namur",
  contractType: "CDI",
  publicationDate: "2026-03-20T09:00:00.000Z",
  url: "https://example.test/1?utm=a",
  source: "forem",
};

describe("buildUnsubscribeUrl", () => {
  it("points at the public unsubscribe route with the token", () => {
    expect(buildUnsubscribeUrl("abc123")).toContain("/api/alerts/unsubscribe?token=abc123");
  });
});

describe("buildJobAlertEmail", () => {
  it("lists the offers with escaped content and a working link", () => {
    const email = buildJobAlertEmail({
      to: "user@example.com",
      firstName: "Ada",
      alertName: "Développeur à Namur",
      offers: [offer],
      totalMatching: 3,
      unsubscribeToken: "tok",
    });

    expect(email.subject).toContain("3 nouvelle(s) offre(s)");
    expect(email.html).toContain("Développeur &lt;React&gt;");
    expect(email.html).toContain("ACME &amp; Co");
    expect(email.html).toContain("https://example.test/1?utm=a");
    // Two more matches than shown offers: the email says so.
    expect(email.html).toContain("2 autre(s) offre(s)");
  });

  it("carries the unsubscribe link and the GDPR footer", () => {
    const email = buildJobAlertEmail({
      to: "user@example.com",
      firstName: "",
      alertName: "",
      offers: [offer],
      totalMatching: 1,
      unsubscribeToken: "tok",
    });

    expect(email.html).toContain("/api/alerts/unsubscribe?token=tok");
    expect(email.html).toContain("Responsable de traitement");
    expect(email.html).toContain("Vous recevez cet email parce que vous avez créé une alerte");
    expect(email.text).toContain("Se désinscrire");
    // Empty first name must not produce "Bonjour ,".
    expect(email.text).toContain("Bonjour bonjour");
  });
});
