import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Pixel 7"] });

function buildMessages(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    conversationId: 202,
    type: "text" as const,
    content: `Message mobile ${index + 1}`,
    metadata: {},
    createdAt: new Date(Date.UTC(2026, 2, 20, 8, index)).toISOString(),
    editedAt: null,
    deletedAt: null,
    author: {
      id: index % 2 === 0 ? 2 : 1,
      email: index % 2 === 0 ? "coach@example.com" : "user@example.com",
      firstName: index % 2 === 0 ? "Camille" : "Jordi",
      lastName: index % 2 === 0 ? "Coach" : "User",
      role: index % 2 === 0 ? "coach" : "user",
    },
    isOwnMessage: index % 2 === 0,
  }));
}

test("opens a DM in a dedicated mobile thread and lands at the bottom", async ({ page }) => {
  const directMessages = buildMessages(28);
  const directConversation = {
    id: 202,
    type: "direct" as const,
    title: "Camille Coach",
    subtitle: "coach@example.com",
    participantCount: 2,
    participants: [
      {
        id: 1,
        email: "user@example.com",
        firstName: "Jordi",
        lastName: "User",
        role: "user",
      },
      {
        id: 2,
        email: "coach@example.com",
        firstName: "Camille",
        lastName: "Coach",
        role: "coach",
      },
    ],
    canModerateMessages: false,
    messages: directMessages,
  };

  const conversations = [
    {
      id: 101,
      type: "group" as const,
      title: "Groupe Liege",
      subtitle: "2 participants",
      unreadCount: 0,
      lastMessageAt: "2026-03-24T09:00:00.000Z",
      lastMessagePreview: "Point coaching du jour",
    },
    {
      id: 202,
      type: "direct" as const,
      title: "Camille Coach",
      subtitle: "coach@example.com",
      unreadCount: 4,
      lastMessageAt: directMessages[directMessages.length - 1]?.createdAt ?? "2026-03-24T10:00:00.000Z",
      lastMessagePreview: directMessages[directMessages.length - 1]?.content ?? null,
    },
  ];

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      json: {
        user: {
          id: 1,
          email: "user@example.com",
          firstName: "Jordi",
          lastName: "User",
          role: "user",
        },
      },
    });
  });

  await page.route("**/api/applications", async (route) => {
    await route.fulfill({ json: { applications: [] } });
  });

  await page.route("**/api/messages/**", async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === "/api/messages/conversations") {
      await route.fulfill({ json: { conversations } });
      return;
    }

    if (url.pathname === "/api/messages/conversations/101") {
      await route.fulfill({
        json: {
          conversation: {
            id: 101,
            type: "group",
            title: "Groupe Liege",
            subtitle: "2 participants",
            participantCount: 2,
            participants: directConversation.participants,
            canModerateMessages: true,
            messages: [],
          },
        },
      });
      return;
    }

    if (url.pathname === "/api/messages/conversations/202") {
      await route.fulfill({ json: { conversation: directConversation } });
      return;
    }

    await route.fallback();
  });

  await page.goto("/messages");

  await expect(page.getByText("Conversations").first()).toBeVisible();
  await expect(page.locator("main > footer")).toHaveCount(0);
  await page.getByText("Camille Coach").first().click();

  const mobileThread = page
    .locator("[data-slot='card']")
    .filter({ has: page.getByLabel("Retour aux conversations") })
    .first();

  await expect(page.getByLabel("Retour aux conversations")).toHaveAttribute(
    "aria-label",
    "Retour aux conversations"
  );
  await expect(mobileThread.getByText("Message mobile 28").first()).toBeVisible();

  await expect
    .poll(async () =>
      mobileThread.evaluate((thread) => {
        const viewport = thread.querySelector<HTMLElement>(
          "[data-slot='scroll-area-viewport']"
        );

        if (!viewport) {
          return null;
        }

        return Math.abs(
          viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop
        );
      })
    )
    .toBeLessThan(24);

  await expect
    .poll(async () => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");

  await page.getByLabel("Retour aux conversations").click();
  await expect(page.getByLabel("Retour aux conversations")).not.toBeVisible();
  await expect
    .poll(async () => page.evaluate(() => document.body.style.overflow))
    .not.toBe("hidden");
});
