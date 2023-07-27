// SPDX-License-Identifier: MIT

import { entities as misskeyEntities } from "misskey-js";
import { GAS } from "./common";
import { Langs, RunResult, Runner, Runners } from "./runner";

declare function misskeyEmoji(emojiName: string, altText?: string): string;
declare const langs: Langs;
declare function determineLang(name: string): keyof Langs | null;
declare const runners: Runners;
declare function determineRunners({}: {
  name?: string;
  lang?: keyof Langs;
}): (keyof Runners)[];

const commands: {
  [key: string]: {
    description: string;
    usages: string[];
    func: (params: string, note: misskeyEntities.Note | null) => string;
  };
} = {
  help: {
    description: "ヘルプあげるよ",
    usages: [
      "でヘルプが貰えるよ。",
      "<command> でそのコマンドについてのヘルプが見れるよ。",
    ],
    func: help,
  },
  run: {
    description: "コードを実行するよ (対応言語は /langs コマンドで確認してね)",
    usages: [
      "<language> (<runner>) ````\\n<code>\\n```` (````\\n<input>\\n````) でコードを実行するよ。",
      "(<runner>) ````<language>\\n<code>\\n```` (````\\n<input>\\n````) みたいに言語を指定してもいいよ。",
    ],
    func: run,
  },
  langs: {
    description: "/run コマンド対応言語一覧をあげるよ",
    usages: [
      "で言語一覧が貰えるよ。",
      "<runner> でその実行環境で使える言語一覧が見れるよ。",
    ],
    func: listLangs,
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
      /^```[^\n]*\n.+?\n```$/ms
    );
    if (codeBlock == null) {
      throw new Error("コードブロックが見つからないよ！");
    }
    const ext: string = codeBlock[0].match(/(?<=^```).*/)![0].toLowerCase();
    const code: string = codeBlock[0].match(/(?<=\n).+(?=\n)/s)![0];
    const inputBlock: RegExpMatchArray | null = params
      .slice(codeBlock.index! + codeBlock[0].length)
      .match(/^```[^\n]*\n.+\n```$/ms);
    const input: string | null =
      inputBlock?.[0].match(/(?<=\n).+(?=\n)/s)![0] ?? null;
    const args: string[] = params
      .slice(0, codeBlock.index!)
      .normalize("NFKC")
      .trim()
      .split(/\s+/);
    let runnerId: keyof Runners | null = null;
    let lang: keyof Langs | null = null;
    for (const arg of args) {
      if (arg === "") continue;
      if (runnerId == null) {
        runnerId = determineRunners({ name: arg })[0] ?? null;
        if (runnerId != null) continue;
      }
      if (lang == null) {
        lang = determineLang(arg);
        if (lang != null) continue;
      }
      throw new Error(`「${arg}」ってオプションは無効だよ。`);
    }
    if (lang == null) {
      lang = determineLang(ext);
    }
    if (lang == null) {
      throw new Error("言語を指定してね。");
    }
    if (runnerId == null) {
      runnerId = determineRunners({ lang })[0] ?? null;
      if (runnerId == null) {
        throw new Error(
          `${langs[lang].names[0]} 言語に対応した実行環境は無いっぽいよ！`
        );
      }
    }
    const runner = runners[runnerId];
    if (!runner.langs.some((l) => lang === l)) {
      throw new Error(
        `${runner.names[0]} は ${langs[lang].names[0]} 言語に対応してないよ！`
      );
    }
    // run code
    const result: RunResult = runner.run(
      lang as typeof runner extends Runner<infer P> ? P : never,
      code,
      input ?? ""
    );
    result.langName ??= langs[lang].names[0];
    return (
      "標準出力:" +
      (result.stdout
        ? "\n```\n" +
          result.stdout.slice(0, 1024) +
          (result.stdout.length > 1024 ? " ..." : "") +
          "\n```\n"
        : "\n") +
      "標準エラー出力:" +
      (result.stderr
        ? "\n```\n" +
          result.stderr.slice(0, 1024) +
          (result.stderr.length > 1024 ? " ..." : "") +
          "\n```\n"
        : "\n") +
      (result.exitCode ? `終了コード: ${result.exitCode}\n` : "") +
      `言語: ${result.langName} (${runner.names[0]})\n` +
      `コード長: ${Utilities.newBlob(code).getBytes().length} Byte\n` +
      `結果: ${misskeyEmoji(result.status)}\n` +
      (result.execTime != null ? `実行時間: ${result.execTime} ms\n` : "") +
      (result.memory != null ? `メモリ: ${result.memory} KB\n` : "")
    ).trim();
  } catch (error) {
    return `[ERROR] ${
      error instanceof Error && error.name === "Error" ? error.message : error
    }`;
  }
}

function listLangs(params: string): string {
  if (!params) {
    return (
      "/run コマンド対応言語一覧:\n" +
      (Object.entries(langs) as [keyof Langs, Langs[keyof Langs]][])
        .map(([lang, { names }]) => {
          const runnerNames: string[] = determineRunners({ lang }).map(
            (runnerId) => runners[runnerId].names[0]
          );
          return runnerNames.length >= 1
            ? `- ${names[0]} (${runnerNames.join(", ")})`
            : null;
        })
        .filter((line) => line != null)
        .join("\n")
    );
  }
  const runnerId: keyof Runners | null =
    determineRunners({ name: params })[0] ?? null;
  if (runnerId == null) {
    return (
      "[ERROR] " +
      (params.length <= 16 ? params : params.slice(0, 16) + "...") +
      " って実行環境はないかな～。ごめんね！"
    );
  }
  const runner = runners[runnerId];
  return (
    `${runner.names[0]} で使える言語一覧:\n` +
    runner.langs.map((lang) => langs[lang].names[0]).join(", ")
  );
}
