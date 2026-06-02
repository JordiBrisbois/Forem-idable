import { createClient } from "redis";
import { db, ensureDatabase } from "@/lib/server/db";
import { loadActiveConversationParticipantIds } from "@/lib/server/messaging.data";
import { logServerEvent } from "@/lib/server/observability";
import { MessageStreamEvent } from "@/types/messaging";

type MessageEventListener = (event: MessageStreamEvent) => void;
type MessageEventRegistry = Map<number, Set<MessageEventListener>>;
type MessageEventRedisClient = ReturnType<typeof createClient>;
type MessageEventRedisClients = {
  publisher: MessageEventRedisClient;
  subscriber: MessageEventRedisClient;
};
type MessageEventSubscriptionCounts = Map<number, number>;

declare global {
  var __foremMessageEventRegistry: MessageEventRegistry | undefined;
  var __foremRedisMessageEventPublisher: MessageEventRedisClient | undefined;
  var __foremRedisMessageEventSubscriber: MessageEventRedisClient | undefined;
  var __foremRedisMessageEventPromise: Promise<MessageEventRedisClients | null> | undefined;
  var __foremRedisMessageEventSubscriptionCounts: MessageEventSubscriptionCounts | undefined;
}

function getRegistry(): MessageEventRegistry {
  if (!globalThis.__foremMessageEventRegistry) {
    globalThis.__foremMessageEventRegistry = new Map();
  }

  return globalThis.__foremMessageEventRegistry;
}

function getSubscriptionCounts(): MessageEventSubscriptionCounts {
  if (!globalThis.__foremRedisMessageEventSubscriptionCounts) {
    globalThis.__foremRedisMessageEventSubscriptionCounts = new Map();
  }

  return globalThis.__foremRedisMessageEventSubscriptionCounts;
}

function buildUserChannel(userId: number) {
  return `messages:user:${userId}`;
}

function dispatchLocalMessageEvent(userId: number, event: MessageStreamEvent) {
  const listeners = getRegistry().get(userId);
  if (!listeners?.size) {
    return;
  }

  for (const listener of listeners) {
    listener(event);
  }
}

async function getRedisClients() {
  if (
    globalThis.__foremRedisMessageEventPublisher?.isOpen &&
    globalThis.__foremRedisMessageEventSubscriber?.isOpen
  ) {
    return {
      publisher: globalThis.__foremRedisMessageEventPublisher,
      subscriber: globalThis.__foremRedisMessageEventSubscriber,
    };
  }

  if (globalThis.__foremRedisMessageEventPromise) {
    return globalThis.__foremRedisMessageEventPromise;
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return null;
  }

  globalThis.__foremRedisMessageEventPromise = (async () => {
    try {
      const publisher = createClient({ url: redisUrl });
      const subscriber = publisher.duplicate();

      publisher.on("error", (error) => {
        console.error("Redis message events publisher error", error);
      });
      subscriber.on("error", (error) => {
        console.error("Redis message events subscriber error", error);
      });

      await Promise.all([publisher.connect(), subscriber.connect()]);

      globalThis.__foremRedisMessageEventPublisher = publisher;
      globalThis.__foremRedisMessageEventSubscriber = subscriber;

      return { publisher, subscriber };
    } catch (error) {
      console.error("Redis message events unavailable", error);
      return null;
    } finally {
      globalThis.__foremRedisMessageEventPromise = undefined;
    }
  })();

  return globalThis.__foremRedisMessageEventPromise;
}

async function ensureRedisSubscription(userId: number) {
  const clients = await getRedisClients();
  if (!clients) {
    return false;
  }

  const subscriptionCounts = getSubscriptionCounts();
  const nextCount = (subscriptionCounts.get(userId) ?? 0) + 1;
  subscriptionCounts.set(userId, nextCount);

  if (nextCount > 1) {
    return true;
  }

  const channel = buildUserChannel(userId);

  try {
    await clients.subscriber.subscribe(channel, (payload) => {
      try {
        const event = JSON.parse(payload) as MessageStreamEvent;
        dispatchLocalMessageEvent(userId, event);
      } catch (error) {
        logServerEvent({
          category: "messages",
          action: "sse-invalid-payload",
          level: "warn",
          meta: {
            userId,
            reason: error instanceof Error ? error.message : "unknown",
          },
        });
      }
    });
    return true;
  } catch (error) {
    subscriptionCounts.delete(userId);
    console.error("Redis message events subscribe error", error);
    logServerEvent({
      category: "redis",
      action: "message-events-subscribe-fallback",
      level: "warn",
      meta: {
        userId,
        reason: error instanceof Error ? error.message : "unknown",
      },
    });
    return false;
  }
}

async function releaseRedisSubscription(userId: number) {
  const clients = await getRedisClients();
  if (!clients) {
    return;
  }

  const subscriptionCounts = getSubscriptionCounts();
  const currentCount = subscriptionCounts.get(userId);
  if (!currentCount) {
    return;
  }

  if (currentCount > 1) {
    subscriptionCounts.set(userId, currentCount - 1);
    return;
  }

  subscriptionCounts.delete(userId);

  try {
    await clients.subscriber.unsubscribe(buildUserChannel(userId));
  } catch (error) {
    console.error("Redis message events unsubscribe error", error);
    logServerEvent({
      category: "redis",
      action: "message-events-unsubscribe-error",
      level: "warn",
      meta: {
        userId,
        reason: error instanceof Error ? error.message : "unknown",
      },
    });
  }
}

export function subscribeMessageEvents(userId: number, listener: MessageEventListener) {
  const registry = getRegistry();
  const listeners = registry.get(userId) ?? new Set<MessageEventListener>();
  listeners.add(listener);
  registry.set(userId, listeners);

  void ensureRedisSubscription(userId);

  return () => {
    const currentListeners = registry.get(userId);
    if (!currentListeners) {
      return;
    }

    currentListeners.delete(listener);
    if (currentListeners.size === 0) {
      registry.delete(userId);
    }

    void releaseRedisSubscription(userId);
  };
}

export async function publishMessageEvent(userIds: number[], event: MessageStreamEvent) {
  const targetUserIds = [...new Set(userIds)];
  const clients = await getRedisClients();

  if (clients) {
    try {
      await Promise.all(
        targetUserIds.map((userId) =>
          clients.publisher.publish(buildUserChannel(userId), JSON.stringify(event))
        )
      );
      return;
    } catch (error) {
      console.error("Redis message events publish error", error);
      logServerEvent({
        category: "redis",
        action: "message-events-publish-fallback",
        level: "warn",
        meta: {
          reason: error instanceof Error ? error.message : "unknown",
          userCount: targetUserIds.length,
        },
      });
    }
  }

  for (const userId of targetUserIds) {
    dispatchLocalMessageEvent(userId, event);
  }
}

export async function publishConversationEvent(
  conversationId: number,
  event: MessageStreamEvent
) {
  await ensureDatabase();

  const participantIds = await loadActiveConversationParticipantIds(db, conversationId);
  await publishMessageEvent(participantIds, event);
}
