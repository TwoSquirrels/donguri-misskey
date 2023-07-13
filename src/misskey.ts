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
        `${error}\n` +
          `\nerror: ${JSON.stringify(error, null, 2)}\n` +
          `\nevent: ${JSON.stringify(event, null, 2)}`
      );
    }
    return ContentService.createTextOutput("Failed.\n");
  }
}

function mentioned(note: MisskeyNote): void {
  if (note.userId === getMyUser().id) return;
  if (note.user.isBot) return;
  const COOLTIME = 5;
  const hits = parseInt(cache.get(`misskey/cooldown/${note.userId}`) ?? "0");
  cache.put(`misskey/cooldown/${note.userId}`, `${hits + 1}`, COOLTIME);
  if (hits >= 1) {
    if (hits === 1) {
      replyMisskey(
        note,
        "[ERROR] メンションが早すぎます！" + `${COOLTIME} 秒くらい待ってね！`
      );
    }
    return;
  }
  try {
    const prompt: string = (
      note.text.match(
        new RegExp(
          `(?<=@${getMyUser().username}(@${properties.MISSKEY_HOST})?)` +
            "[^0-9A-Za-z_@].*$",
          "is" // ignore case + dotAll
        )
      )?.[0] ?? ""
    ).trim();
    if (prompt === "") {
      replyMisskey(note, help(""));
    } else if (prompt[0] === "/") {
      const command: string = prompt.match(/(?<=\/).*?(?=\s|$)/)![0];
      const params: string = prompt.slice(1 + command.length + 1);
      replyMisskey(
        note,
        execute(command.normalize("NFKC").toLowerCase(), params, note).trim()
      );
    } else {
      replyMisskey(note, chat(note));
    }
  } catch (error) {
    const reply: MisskeyNote = replyMisskey(
      note,
      "[ERROR] ごめん！未知のエラーでちゃった！"
    );
    callMisskey("notes/favorites/create", { noteId: reply.id });
    throw error;
  }
}

function getMyUser(): MisskeyUser {
  const cachedUserJson: ?string = cache.get("misskey/i");
  if (cachedUserJson) return JSON.parse(cachedUserJson) as MisskeyUser;
  const user = callMisskey("i") as MisskeyUser;
  cache.put("misskey/i", JSON.stringify(user));
  return user as MisskeyUser;
}

function replyMisskey(note: MisskeyNote, text: string): MisskeyNote {
  return callMisskey("notes/create", {
    text:
      `@${note.user.username}` +
      (note.user.host ? `@${note.user.host}` : "") +
      (text.match(/\n/) ? "\n" : " ") +
      text,
    replyId: note.id,
    ...(note.visibility === "specified"
      ? {
          visibility: "specified",
          visibleUserIds: [...note.visibleUserIds, note.userId],
        }
      : { visibility: "home" }),
  }).createdNote as MisskeyNote;
}

function callMisskey(endpoint: string, params: Object = {}): unknown {
  const resJson: string = UrlFetchApp.fetch(
    `https://${properties.MISSKEY_HOST}/api/${endpoint}`,
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ i: properties.MISSKEY_TOKEN, ...params }),
    }
  ).getContentText();
  const res = JSON.parse(resJson);
  if (res.error) throw res.error;
  return res;
}
