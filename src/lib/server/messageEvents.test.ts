import { afterEach, describe, expect, it, vi } from "vitest";

const redisConnectMock = vi.fn();
const redisOnMock = vi.fn();
const redisPublishMock = vi.fn();
const redisSubscribeMock = vi.fn();
const redisUnsubscribeMock = vi.fn();
const redisSubscriberCallbacks = new Map<string, (payload: string) => void>();

vi.mock("redis", () => ({
  createClient: vi.fn(() => {
    const subscriber = {
      isOpen: true,
      on: redisOnMock,
      connect: redisConnectMock,
      subscribe: redisSubscribeMock.mockImplementation(
        async (channel: string, listener: (payload: string) => void) => {
          redisSubscriberCallbacks.set(channel, listener);
        }
      ),
      unsubscribe: redisUnsubscribeMock.mockImplementation(async (channel: string) => {
        redisSubscriberCallbacks.delete(channel);
      }),
    };

    const publisher = {
      isOpen: true,
      on: redisOnMock,
      connect: redisConnectMock,
      publish: redisPublishMock.mockImplementation(async (channel: string, payload: string) => {
        redisSubscriberCallbacks.get(channel)?.(payload);
        return 1;
      }),
      duplicate: vi.fn(() => subscriber),
    };

    return publisher;
  }),
}));

vi.mock("@/lib/server/observability", () => ({
  logServerEvent: vi.fn(),
}));

function flushPromises() {
  return Promise.resolve().then(() => Promise.resolve());
}

describe("messageEvents", () => {
  afterEach(() => {
    globalThis.__foremMessageEventRegistry?.clear();
    globalThis.__foremMessageEventRegistry = undefined;
    globalThis.__foremRedisMessageEventPublisher = undefined;
    globalThis.__foremRedisMessageEventSubscriber = undefined;
    globalThis.__foremRedisMessageEventPromise = undefined;
    globalThis.__foremRedisMessageEventSubscriptionCounts?.clear();
    globalThis.__foremRedisMessageEventSubscriptionCounts = undefined;

    redisConnectMock.mockReset();
    redisOnMock.mockReset();
    redisPublishMock.mockReset();
    redisSubscribeMock.mockReset();
    redisUnsubscribeMock.mockReset();
    redisSubscriberCallbacks.clear();

    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("publishes locally when Redis is not configured", async () => {
    vi.stubEnv("REDIS_URL", "");
    const { publishMessageEvent, subscribeMessageEvents } = await import(
      "@/lib/server/messageEvents"
    );
    const listener = vi.fn();
    const event = {
      type: "conversation.created" as const,
      conversationId: 42,
    };

    const unsubscribe = subscribeMessageEvents(7, listener);

    await publishMessageEvent([7], event);
    unsubscribe();
    await publishMessageEvent([7], event);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(event);
  });

  it("uses Redis pub/sub when REDIS_URL is configured", async () => {
    vi.stubEnv("REDIS_URL", "redis://example:6379");
    const { publishMessageEvent, subscribeMessageEvents } = await import(
      "@/lib/server/messageEvents"
    );
    const listener = vi.fn();
    const event = {
      type: "conversation.message_created" as const,
      conversationId: 12,
      messageId: 99,
      message: {
        id: 99,
        conversationId: 12,
        type: "text" as const,
        content: "Salut",
        metadata: {},
        createdAt: "2026-03-25T12:00:00.000Z",
        editedAt: null,
        deletedAt: null,
        author: null,
        isOwnMessage: false,
      },
    };

    subscribeMessageEvents(11, listener);
    await flushPromises();
    await publishMessageEvent([11], event);

    expect(redisConnectMock).toHaveBeenCalledTimes(2);
    expect(redisSubscribeMock).toHaveBeenCalledTimes(1);
    expect(redisSubscribeMock).toHaveBeenCalledWith(
      "messages:user:11",
      expect.any(Function)
    );
    expect(redisPublishMock).toHaveBeenCalledWith(
      "messages:user:11",
      JSON.stringify(event)
    );
    expect(listener).toHaveBeenCalledWith(event);
  });

  it("falls back to local delivery when Redis publish fails", async () => {
    vi.stubEnv("REDIS_URL", "redis://example:6379");
    vi.spyOn(console, "error").mockImplementation(() => {});
    redisPublishMock.mockRejectedValueOnce(new Error("redis down"));

    const { publishMessageEvent, subscribeMessageEvents } = await import(
      "@/lib/server/messageEvents"
    );
    const listener = vi.fn();
    const event = {
      type: "conversation.read_updated" as const,
      conversationId: 5,
      userId: 11,
    };

    subscribeMessageEvents(11, listener);
    await flushPromises();
    await publishMessageEvent([11], event);

    expect(listener).toHaveBeenCalledWith(event);
  });

  it("reuses a single Redis subscription per user on the same instance", async () => {
    vi.stubEnv("REDIS_URL", "redis://example:6379");
    const { subscribeMessageEvents } = await import("@/lib/server/messageEvents");

    const unsubscribeFirst = subscribeMessageEvents(19, vi.fn());
    const unsubscribeSecond = subscribeMessageEvents(19, vi.fn());

    await flushPromises();
    expect(redisSubscribeMock).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    await flushPromises();
    expect(redisUnsubscribeMock).not.toHaveBeenCalled();

    unsubscribeSecond();
    await flushPromises();
    expect(redisUnsubscribeMock).toHaveBeenCalledTimes(1);
    expect(redisUnsubscribeMock).toHaveBeenCalledWith("messages:user:19");
  });
});
