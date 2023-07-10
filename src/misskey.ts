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

const properties: {
  DEBUG_EMAIL: string;
  MISSKEY_HOST: string;
  MISSKEY_TOKEN?: string;
} = PropertiesService.getScriptProperties().getProperties();

function doPost(event: Event): TextOutput {
  try {
    const req = JSON.parse(event.postData.contents) as MisskeyRequest;
    if (req.type === "mention") {
      mentioned(req.body.note!!);
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
  const resJson: string = UrlFetchApp.fetch(
    `https://${properties.MISSKEY_HOST}/api/notes/create`,
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        i: properties.MISSKEY_TOKEN,
        text: "```\n" + JSON.stringify(note.text) + "\n```",
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
