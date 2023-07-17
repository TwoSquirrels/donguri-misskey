// SPDX-License-Identifier: MIT

import { entities as misskeyEntities } from "misskey-js";
import { GAS, MisskeyBot, MisskeyHookEvent } from "./common";

declare const cache: GAS.Cache.Cache;
declare const DEBUG_EMAIL: string | undefined;
declare const bot: MisskeyBot;
declare function execute(
  command: string,
  params?: string,
  note?: misskeyEntities.Note | null
): string;
declare function help(params: string): string;
declare function chat(note: misskeyEntities.Note): string;

function doPost(event: GAS.Events.DoPost): GAS.Content.TextOutput {
  try {
    const hookEvent = JSON.parse(event.postData.contents) as MisskeyHookEvent;
    if (cache.get(`misskey/received/${hookEvent.eventId}`)) {
      return ContentService.createTextOutput("Already Received.\n");
    }
    cache.put(`misskey/events/${hookEvent.eventId}`, "RECEIVED");
    if (hookEvent.type === "mention") {
      mentioned(hookEvent.body.note);
    }
    return ContentService.createTextOutput("OK.\n");
  } catch (error) {
    if (DEBUG_EMAIL) {
      GmailApp.sendEmail(
        DEBUG_EMAIL,
        "[DEBUG] Error occured in Donguri BOT (Misskey)",
        `${error}\n` +
          `\nerror: ${JSON.stringify(error, null, 2)}\n` +
          `\nevent: ${JSON.stringify(event, null, 2)}`
      );
    }
    return ContentService.createTextOutput("Failed.\n");
  }
}

function mentioned(note: misskeyEntities.Note): void {
  if (note.userId === bot.getMyUser().id) return;
  if ((note.user as misskeyEntities.UserDetailed).isBot) return;
  const COOLTIME = 5;
  const hits = parseInt(cache.get(`misskey/cooldown/${note.userId}`) ?? "0");
  cache.put(`misskey/cooldown/${note.userId}`, `${hits + 1}`, COOLTIME);
  if (hits >= 1) {
    if (hits === 1) {
      bot.reply(
        note,
        "[ERROR] メンションが早すぎます！" + `${COOLTIME} 秒くらい待ってね！`
      );
    }
    return;
  }
  try {
    const content = (note.cw == null ? "" : note.cw + "\n") + (note.text ?? "");
    const prompt: string = (
      content.match(
        new RegExp(
          `(?<=(^|[^0-9a-z])@${bot.getMyUser().username}` +
            `(@${bot.host.replaceAll(".", "\\.")})?)` +
            "[^0-9a-z_\\-\\.@].*$",
          "is" // ignoreCase + dotAll
        )
      )?.[0] ?? content
    ).trim();
    if (prompt === "") {
      bot.reply(note, help(""));
    } else if (prompt[0] === "/") {
      const command: string = prompt.match(/(?<=\/).*?(?=\s|$)/)![0];
      const params: string = prompt.slice(1 + command.length + 1);
      bot.reply(
        note,
        execute(command.normalize("NFKC").toLowerCase(), params, note).trim()
      );
    } else {
      bot.reply(note, chat(note));
    }
  } catch (error) {
    const reply: misskeyEntities.Note = bot.reply(
      note,
      "[ERROR] ごめん！未知のエラーでちゃった！"
    );
    bot.favNote(reply.id);
    throw error;
  }
}
