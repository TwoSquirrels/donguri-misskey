// SPDX-License-Identifier: MIT

import { Runner } from ".";

function getLocalRunner(names: [string, ...string[]]) {
  return new Runner(names, ["text", "brainfuck"], (lang, code, input = "") => {
    switch (lang) {
      case "text":
        return { status: "AC", stdout: code, stderr: "", execTime: 0 };
      case "brainfuck":
        throw new Error("brainfuck は実装予定だから、ちょっと待ってね。");
    }
  });
}

export type LocalRunner = ReturnType<typeof getLocalRunner>;
