import { describe, expect, it } from "vitest";
import type { Job } from "@/types/job";
import { buildAlertsDigestEmail, buildManageAlertsUrl, buildUnsubscribeUrl } from "./email";

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

const section = {
  alertName: "Développeur à Namur",
  offers: [offer],
  totalMatching: 1,
  unsubscribeToken: "tok-a",
};

describe("buildUnsubscribeUrl / buildManageAlertsUrl", () => {
  it("points at the public unsubscribe route and the account section", () => {
    expect(buildUnsubscribeUrl("abc")).toContain("/api/alerts/unsubscribe?token=abc");
    expect(buildManageAlertsUrl()).toContain("/account#alertes");
  });
});

describe("buildAlertsDigestEmail", () => {
  it("groups several alerts in one email, each with its own unsubscribe link", () => {
    const email = buildAlertsDigestEmail({
      to: "user@example.com",
      firstName: "Ada",
      sections: [section, { ...section, alertName: "Stages data", unsubscribeToken: "tok-b" }],
    });

    expect(email.subject).toBe("2 nouvelle(s) offre(s) pour vos 2 alertes");
    expect(email.html).toContain("Développeur à Namur");
    expect(email.html).toContain("Stages data");
    expect(email.html).toContain("token=tok-a");
    expect(email.html).toContain("token=tok-b");
    expect(email.html).toContain("/account#alertes");
    expect(email.text).toContain("Se désinscrire de cette alerte : ");
  });

  it("escapes the offer and alert content", () => {
    const email = buildAlertsDigestEmail({
      to: "user@example.com",
      firstName: "Ada",
      sections: [{ ...section, alertName: "Recherche <script>" }],
    });

    expect(email.html).toContain("Développeur &lt;React&gt;");
    expect(email.html).toContain("ACME &amp; Co");
    expect(email.html).not.toContain("<script>");
  });

  it("mentions the offers that did not fit in the section", () => {
    const email = buildAlertsDigestEmail({
      to: "user@example.com",
      firstName: "Ada",
      sections: [{ ...section, totalMatching: 4 }],
    });

    expect(email.subject).toBe("4 nouvelle(s) offre(s) pour « Développeur à Namur »");
    expect(email.html).toContain("3 autre(s) offre(s) correspondent à cette alerte.");
  });

  it("states the GDPR footer and that one email covers every alert", () => {
    const email = buildAlertsDigestEmail({
      to: "user@example.com",
      firstName: "",
      sections: [section],
    });

    expect(email.html).toContain("Responsable de traitement");
    expect(email.html).toContain("Un seul email par jour regroupe toutes vos alertes.");
    expect(email.text).toContain("Bonjour bonjour");
  });
});
