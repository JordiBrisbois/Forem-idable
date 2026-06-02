import { expect, test, type Route } from "@playwright/test";

type ConversationFixture = {
  id: number;
  type: "group" | "direct";
  title: string;
  subtitle: string;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  participantCount: number;
};

test("opens a direct conversation from the messages page contact picker", async ({ page }) => {
  let conversations: ConversationFixture[] = [
    {
      id: 101,
      type: "group" as const,
      title: "Groupe Liege",
      subtitle: "2 participants",
      unreadCount: 0,
      lastMessageAt: "2026-03-24T09:00:00.000Z",
      lastMessagePreview: "Point coaching du jour",
      participantCount: 2,
    },
  ];
  let createdPayload: { targetUserId: number } | null = null;

  await page.route("**/api/auth/me", async (route: Route) => {
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

  await page.route("**/api/applications", async (route: Route) => {
    await route.fulfill({ json: { applications: [] } });
  });

  await page.route("**/api/messages/contacts", async (route: Route) => {
    await route.fulfill({
      json: {
        contacts: [
          {
            userId: 2,
            firstName: "Camille",
            lastName: "Coach",
            email: "coach@example.com",
            role: "coach",
            sharedGroupCount: 1,
            relationLabel: "1 groupe commun",
          },
        ],
      },
    });
  });

  await page.route("**/api/messages/conversations/direct", async (route: Route) => {
    createdPayload = (await route.request().postDataJSON()) as { targetUserId: number };
    conversations = [
      ...conversations,
      {
        id: 202,
        type: "direct",
        title: "Camille Coach",
        subtitle: "coach@example.com",
        unreadCount: 0,
        lastMessageAt: "2026-03-24T10:00:00.000Z",
        lastMessagePreview: null,
        participantCount: 2,
      },
    ];

    await route.fulfill({
      json: {
        conversation: {
          id: 202,
          type: "direct",
          title: "Camille Coach",
          subtitle: "coach@example.com",
          unreadCount: 0,
          lastMessageAt: "2026-03-24T10:00:00.000Z",
          lastMessagePreview: null,
          participantCount: 2,
          canModerateMessages: false,
          participants: [
            {
              userId: 1,
              firstName: "Jordi",
              lastName: "User",
              email: "user@example.com",
              role: "user",
              joinedAt: "2026-03-24T10:00:00.000Z",
              leftAt: null,
            },
            {
              userId: 2,
              firstName: "Camille",
              lastName: "Coach",
              email: "coach@example.com",
              role: "coach",
              joinedAt: "2026-03-24T10:00:00.000Z",
              leftAt: null,
            },
          ],
          messages: [],
        },
      },
    });
  });

  await page.route("**/api/messages/**", async (route: Route) => {
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
            participants: [],
            canModerateMessages: true,
            messages: [],
          },
        },
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/messages");

  await page.getByRole("button", { name: "Nouveau DM" }).click();
  await expect(page.getByRole("dialog", { name: "Nouveau message privé" })).toBeVisible();

  await page.getByRole("button", { name: /Camille Coach/i }).click();

  await expect.poll(() => createdPayload).toEqual({ targetUserId: 2 });
  await expect(page.getByRole("dialog", { name: "Nouveau message privé" })).not.toBeVisible();
  await expect(page.getByPlaceholder("Écrire un message")).toBeVisible();
});
