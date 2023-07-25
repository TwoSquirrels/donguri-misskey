// SPDX-License-Identifier: MIT

import { Runner } from ".";

function getWandboxRunner(names: [string, ...string[]]) {
  return new Runner(
    names,
    /* prettier-ignore */ [
      "bash", "c", "csharp", "cpp", "crystal", "d", "elixir", "erlang",
      "go", "groovy", "haskell", "java", "javascript", "julia",
      "lazyk", "lisp", "lua", "nim", "ocaml", "openssl",
      "pascal", "perl", "php", "pony", "pypy", "pypy2", "python", "python2",
      "r", "ruby", "rust", "scala", "sqlite", "swift", "typescript", "vim", "zig",
    ],
    (lang, code, input = "") => {
      throw new Error("Wandbox は対応予定だから、ちょっと待ってね。");
    }
  );
}

export type WandboxRunner = ReturnType<typeof getWandboxRunner>;
