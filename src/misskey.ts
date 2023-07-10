// SPDX-License-Identifier: MIT

interface MisskeyUser {
  id: string;
  createdAt: string;
  username: string;
  host?: string;
  name: string;
  onlineStatus: "online" | "active" | "offline" | "unknown";
  avatarUrl: string;
  avatarBlurhash: string;
  isBot: boolean;
  isCat: boolean;
}

interface MisskeyNote {
  id: string;
  createdAt: string;
  text?: string;
  cw?: string;
  user: MisskeyUser;
  userId: string;
  visibility: "public" | "home" | "followers" | "specified";
  visibleUserIds?: string[];
}

interface MisskeyRequest {
  hookId: string;
  userId: string;
  eventId: string;
  createdAt: number;
  type:
    | "follow"
    | "followed"
    | "unfollow"
    | "note"
    | "reply"
    | "renote"
    | "mention";
  body: { user?: MisskeyUser; note?: MisskeyNote };
}

const cache: Cache = CacheService.getScriptCache();

const properties: {
  DEBUG_EMAIL: string;
  MISSKEY_HOST: string;
  MISSKEY_TOKEN?: string;
} = PropertiesService.getScriptProperties().getProperties();

function doPost(event: Event): TextOutput {
  try {
    const req = JSON.parse(event.postData.contents) as MisskeyRequest;
    if (cache.get(`misskey/received/${req.eventId}`)) {
      return ContentService.createTextOutput("Already Received.\n");
    }
    cache.put(`misskey/events/${req.eventId}`, "RECEIVED");
    if (req.type === "mention") {
      mentioned(req.body.note!);
    }
    return ContentService.createTextOutput("OK.\n");
  } catch (error) {
    if (properties.DEBUG_EMAIL) {
      GmailApp.sendEmail(
        properties.DEBUG_EMAIL,
        "[DEBUG] Error occured in Donguri BOT (Misskey)",
        error.message + "\n\n" + JSON.stringify(error, null, 2)
      );
    }
    return ContentService.createTextOutput("Failed.\n");
  }
}

function mentioned(note: MisskeyNote): void {
  if (note.user.isBot) return;
  const prompt: string = note.text
    .match(new RegExp(`(?<=@${getMyUser().username})[^0-9A-Za-z_].*$`))![0]
    .trim();
  const resJson: string = UrlFetchApp.fetch(
    `https://${properties.MISSKEY_HOST}/api/notes/create`,
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        i: properties.MISSKEY_TOKEN,
        text: "```\n" + prompt + "\n```",
        replyId: note.id,
        ...(note.visibility === "specified"
          ? {
              visibility: "specified",
              visibleUserIds: [...note.visibleUserIds, note.userId],
            }
          : { visibility: "home" }),
      }),
    }
  ).getContentText();
  const res = JSON.parse(resJson);
  if (res.error) throw res.error;
}

function getMyUser(): MisskeyUser {
  const cachedUserJson: ?string = cache.get("misskey/i");
  if (cachedUserJson) return JSON.parse(cachedUserJson) as MisskeyUser;
  const resJson: string = UrlFetchApp.fetch(
    `https://${properties.MISSKEY_HOST}/api/i`,
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ i: properties.MISSKEY_TOKEN }),
    }
  ).getContentText();
  const res = JSON.parse(resJson);
  if (res.error) throw res.error;
  cache.put("misskey/i", resJson);
  return res as MisskeyUser;
}
