import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchConversations, fetchMessageContacts, postConversationMessage, shareDirectMessage } =
  vi.hoisted(() => ({
    fetchConversations: vi.fn(),
    fetchMessageContacts: vi.fn(),
    postConversationMessage: vi.fn(),
    shareDirectMessage: vi.fn(),
  }));

vi.mock("@/features/messages/messages.api", () => ({
  fetchConversations,
  fetchMessageContacts,
  postConversationMessage,
  shareDirectMessage,
}));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

import { ShareOfferDialog } from "./ShareOfferDialog";

const job = {
  id: "2164057",
  title: "Peintre carrossier",
  company: "KONVERT",
  location: "Namur",
  contractType: "CDI",
  publicationDate: "2026-11-26T09:00:00.000Z",
  url: "https://www.leforem.be/recherche-offres/offre-detail/2164057",
  source: "forem" as const,
};

const contact = {
  userId: 77,
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@example.test",
  role: "user" as const,
  sharedGroupCount: 1,
  relationLabel: "1 groupe commun",
};

describe("ShareOfferDialog", () => {
  beforeAll(() => {
    // cmdk observes its list; jsdom has neither ResizeObserver nor scrollIntoView.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fetchConversations.mockResolvedValue({ data: { conversations: [] }, response: { ok: true } });
    fetchMessageContacts.mockResolvedValue({ data: { contacts: [contact] }, response: { ok: true } });
    shareDirectMessage.mockResolvedValue({});
    postConversationMessage.mockResolvedValue({});
  });

  it("loads the recipients and sends the offer as a direct message", async () => {
    const onOpenChange = vi.fn();
    render(<ShareOfferDialog job={job} open onOpenChange={onOpenChange} />);

    const option = await screen.findByRole("option", { name: /jean dupont/i });
    fireEvent.click(option);

    await waitFor(() =>
      expect(shareDirectMessage).toHaveBeenCalledWith(
        77,
        expect.stringContaining("leforem.be")
      )
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("explains an empty recipient list instead of showing nothing", async () => {
    fetchMessageContacts.mockResolvedValue({ data: { contacts: [] }, response: { ok: true } });

    render(<ShareOfferDialog job={job} open onOpenChange={vi.fn()} />);

    expect(
      await screen.findByText(/aucune conversation ou personne disponible/i)
    ).toBeVisible();
  });

  it("reports an unavailable share when the API answers with an error", async () => {
    fetchMessageContacts.mockResolvedValue({ data: null, response: { ok: false } });
    fetchConversations.mockResolvedValue({ data: null, response: { ok: false } });

    render(<ShareOfferDialog job={job} open onOpenChange={vi.fn()} />);

    expect(await screen.findByText(/partage indisponible/i)).toBeVisible();
  });
});
