// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import {
  canDirectMessage,
  findOrCreateDirectConversationId,
  getConversationDetail,
  listVisibleConversations,
  markConversationAsRead,
  sendTextMessage,
} from "@/lib/server/messaging";
import {
  createDirectConversation,
  createGroupWithCoachAndMember,
  createUser,
  describeWithDatabase,
  resetDatabase,
} from "@/lib/server/testFixtures";

/**
 * Messaging is the only place where a user can read another user's data, so the
 * access rules are worth exercising against the real join graph (group
 * membership, direct participant rows) rather than against mocks.
 */
describeWithDatabase("messaging (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("allows a coach and a beneficiary of the same group to message each other", async () => {
    const { coach, member } = await createGroupWithCoachAndMember();

    expect(await canDirectMessage(coach, member.id)).toBe(true);
    expect(await canDirectMessage(member, coach.id)).toBe(true);
  });

  it("refuses direct messaging between users who share no group", async () => {
    const alice = await createUser();
    const bob = await createUser();

    expect(await canDirectMessage(alice, bob.id)).toBe(false);
    // Messaging yourself is never a direct conversation.
    expect(await canDirectMessage(alice, alice.id)).toBe(false);
  });

  it("opens one conversation per pair, not one per call", async () => {
    const { coach, member } = await createGroupWithCoachAndMember();

    const first = await findOrCreateDirectConversationId(coach, member.id);
    const second = await findOrCreateDirectConversationId(coach, member.id);
    const reversed = await findOrCreateDirectConversationId(member, coach.id);

    expect(second).toBe(first);
    expect(reversed).toBe(first);
  });

  it("refuses to create a direct conversation with an unrelated user", async () => {
    const coach = await createUser({ role: "coach" });
    const stranger = await createUser();

    await expect(findOrCreateDirectConversationId(coach, stranger.id)).rejects.toThrow(
      "Forbidden"
    );
  });

  it("escapes HTML in stored messages", async () => {
    const { coach, member } = await createGroupWithCoachAndMember();
    const conversationId = await createDirectConversation(coach, member);

    const message = await sendTextMessage(coach, conversationId, '<b>"Bonjour"</b>');

    expect("content" in message && message.content).toBe(
      "&lt;b&gt;&quot;Bonjour&quot;&lt;/b&gt;"
    );

    const detail = await getConversationDetail(member, conversationId);
    expect(detail.messages).toHaveLength(1);
    // The raw tag must never reach a client, even straight from the database.
    expect(detail.messages[0].content ?? "").not.toContain("<b>");
  });

  it("hides a conversation from users who are not participants", async () => {
    const { coach, member } = await createGroupWithCoachAndMember();
    const outsider = await createUser({ role: "coach" });
    const conversationId = await createDirectConversation(coach, member);

    await expect(getConversationDetail(outsider, conversationId)).rejects.toThrow("Forbidden");

    const visible = await listVisibleConversations(outsider);
    expect(visible.map((conversation) => conversation.id)).not.toContain(conversationId);
  });

  it("tracks the unread count and clears it on read", async () => {
    const { coach, member } = await createGroupWithCoachAndMember();
    const conversationId = await createDirectConversation(coach, member);

    await sendTextMessage(coach, conversationId, "Bonjour, où en es-tu ?");

    const beforeRead = await getConversationDetail(member, conversationId);
    expect(beforeRead.unreadCount).toBe(1);

    await markConversationAsRead(member, conversationId);

    const afterRead = await getConversationDetail(member, conversationId);
    expect(afterRead.unreadCount).toBe(0);
    expect(afterRead.messages).toHaveLength(1);
  });

  it("only lists conversations the actor participates in", async () => {
    const { coach, member } = await createGroupWithCoachAndMember();
    const conversationId = await createDirectConversation(coach, member);

    const coachConversations = await listVisibleConversations(coach);
    const memberConversations = await listVisibleConversations(member);

    expect(coachConversations.map((conversation) => conversation.id)).toContain(conversationId);
    expect(memberConversations.map((conversation) => conversation.id)).toContain(conversationId);
  });
});
