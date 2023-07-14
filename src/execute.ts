// SPDX-License-Identifier: MIT

import { entities as misskeyEntities } from "misskey-js";
import { GAS } from "./common";

const commands: {
  [key: string]: {
    description: string;
    usages: string[];
    func: (params: string, note: misskeyEntities.Note | null) => string;
  };
} = {
  help: {
    description: "[未完成] ヘルプあげるよ",
    usages: [
      "でヘルプが貰えるよ。",
      "<command> でそのコマンドについてのヘルプが見れるよ。",
    ],
    func: help,
  },
  run: {
    description: "[未完成] コードを実行するよ",
    usages: [],
    func: run,
  },
};

function execute(
  command: string,
  params: string = "",
  note: misskeyEntities.Note | null = null
): string {
  return commands[command]?.func(params, note) ?? help(command);
}

function help(params: string): string {
  const command: string = params
    .match(/^.*?(?=\s|$)/)![0]
    .replace(/^\//, "")
    .normalize("NFKC")
    .toLowerCase();
  if (command === "") {
    return (
      "この BOT についてはプロフィールを見てね！\n" +
      `\nコマンド一覧:\n${Object.entries(commands)
        .map(([cmd, { description }]) => `/${cmd}: ${description}`)
        .join("\n")}\n` +
      "\nそれぞれのコマンドの使い方は /help <command> で見れるよ！"
    );
  }
  if (!commands[command]) {
    return (
      "[ERROR] /" +
      (command.length <= 16 ? command : command.slice(0, 16) + "...") +
      " ってコマンドはないかな～。ごめんね！\n" +
      "\n/help でコマンド一覧が確認できるよ！"
    );
  }
  const { description, usages } = commands[command];
  return (
    `/${command}: ${description}\n` +
    `\n使い方:\n${usages.map((usage) => `/${command} ${usage}`).join("\n")}`
  );
}

function run(params: string): string {
  try {
    const matchCode: RegExpMatchArray | null = params.match(
      /^```.*\n.+\n```$/ms // multiline + dotAll
    );
    if (matchCode === null) {
      throw new Error("コードブロックが見つからないよ！");
    }
    return "この機能はすぐ作るから、あと 500000 時間くらい待ってて！";
  } catch (error) {
    return `[ERROR] :IE: ${error}`;
  }
}
