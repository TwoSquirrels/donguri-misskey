// SPDX-License-Identifier: MIT

import { entities as misskeyEntities } from "misskey-js";
import { GAS } from "./common";
import { RunResult, Runner } from "./runner";

declare const runners: { [key: string]: Runner };

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
    const codeBlock: RegExpMatchArray | null = params.match(
      /^```.*\n.+\n```$/ms // multiline + dotAll
    );
    if (codeBlock === null) {
      throw new Error("コードブロックが見つからないよ！");
    }
    const ext: string = codeBlock[0].match(/(?<=^```).*/)![0].toLowerCase();
    const code: string = codeBlock[0].match(/(?<=\n).+(?=\n)/s)![0];
    const args: string = params
      .slice(0, codeBlock.index!)
      .normalize("NFKC")
      .toLowerCase()
      .trim();
    // TODO: 言語と実行環境とコンパイラを調べる
    if (args !== "") throw new Error("現状 Text しかできないんだ！ごめんね！");
    const result: RunResult = runners["local"]!("text", code);
    return (
      "標準出力:" +
      (result.stdout ? "\n```\n" + result.stdout + "\n```\n" : "\n") +
      "標準エラー出力:" +
      (result.stderr ? "\n```\n" + result.stderr + "\n```\n" : "\n") +
      (result.exitCode ? `終了コード: ${result.exitCode}\n` : "") +
      `言語: ${"Text"} (${"Local"})\n` +
      `コード長: ${Utilities.newBlob(code).getBytes().length} Byte\n` +
      `結果: ${result.status}\n` +
      (result.execTime != null ? `実行時間: ${result.execTime} ms\n` : "") +
      (result.memory != null ? `メモリ: ${result.memory} KB\n` : "")
    ).trim();
  } catch (error) {
    return `[ERROR] :IE: ${error}`;
  }
}
