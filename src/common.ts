// SPDX-License-Identifier: MIT

import {
  Endpoints as MisskeyEndpoints,
  entities as misskeyEntities,
} from "misskey-js";

export import GAS = GoogleAppsScript;

export class MisskeyBot {
  host: string;
  token: string;

  constructor(host: string, token: string) {
    this.host = host;
    this.token = token;
  }

  callApi<
    E extends keyof MisskeyEndpoints,
    P extends MisskeyEndpoints[E]["req"]
  >(endpoint: E, params: P = {} as P): MisskeyEndpoints[E]["res"] {
    const res: GAS.URL_Fetch.HTTPResponse = UrlFetchApp.fetch(
      `https://${this.host}/api/${endpoint}`,
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({ i: this.token, ...params }),
        muteHttpExceptions: true,
      }
    );
    const status: number = res.getResponseCode();
    if (status === 204) return null;
    const body = JSON.parse(res.getContentText());
    if (status === 200) return body;
    throw body.error;
  }

  getMyUser(): misskeyEntities.User {
    const cachedUserJson: string | null = cache.get("misskey/i");
    if (cachedUserJson)
      return JSON.parse(cachedUserJson) as misskeyEntities.User;
    const user: misskeyEntities.User = this.callApi("i");
    cache.put("misskey/i", JSON.stringify(user));
    return user;
  }

  reply(note: misskeyEntities.Note, text: string): misskeyEntities.Note {
    const mention: string =
      `@${note.user.username}` + (note.user.host ? `@${note.user.host}` : "");
    return this.callApi("notes/create", {
      text:
        (note.cw == null ? mention + (text.match(/\n/) ? "\n" : " ") : "") +
        text,
      cw: note.cw && mention,
      replyId: note.id,
      visibility: note.visibility,
      visibleUserIds: [...(note.visibleUserIds ?? []), note.userId],
      localOnly: note.localOnly,
    }).createdNote;
  }

  favNote(noteId: string): void {
    this.callApi("notes/favorites/create", { noteId });
  }
}

export type MisskeyHookEvent = {
  hookId: string;
  userId: string;
  eventId: string;
  createdAt: number;
} & (
  | {
      type: "follow" | "followed" | "unfollow";
      body: { user: misskeyEntities.User };
    }
  | {
      type: "note" | "reply" | "renote" | "mention";
      body: { note: misskeyEntities.Note };
    }
);

const cache: GAS.Cache.Cache = CacheService.getScriptCache();

const {
  DEBUG_EMAIL,
  MISSKEY_HOST,
  MISSKEY_TOKEN,
  MISSKEY_RATE_LIMIT,
  MISSKEY_EMOJIS,
} = PropertiesService.getScriptProperties().getProperties();

if (!MISSKEY_HOST) throw new Error("MISSKEY_HOST が設定されていません。");
if (!MISSKEY_TOKEN) throw new Error("MISSKEY_TOKEN が設定されていません。");
const bot = new MisskeyBot(MISSKEY_HOST, MISSKEY_TOKEN);

const misskeyRateLimit: number = parseInt(MISSKEY_RATE_LIMIT) || 100;

const misskeyEmojis: { [key: string]: string | undefined } = Object.fromEntries(
  (MISSKEY_EMOJIS ?? "")
    .replace(/\s/g, "")
    .split(/[,;\/\\]/)
    .map((s) => s.split("="))
);

function misskeyEmoji(emojiName: string, altText?: string): string {
  if (!misskeyEmojis[emojiName]) return altText ?? emojiName;
  return `:${misskeyEmojis[emojiName]}:`;
}
