// SPDX-License-Identifier: MIT

import { Runner } from ".";

function getPaizaioRunner(names: string[]) {
  return new Runner(
    names,
    /* prettier-ignore */ [
      "bash", "c", "csharp", "cpp", "clojure", "cobol",
      "coffeescript", "d", "elixir", "erlang", "fsharp", "go",
      "haskell", "java", "javascript", "kotlin", "mysql",
      "nako", "objectivec", "perl", "php", "python2",
      "python", "r", "ruby", "rust", "scala", "scheme",
      "swift", "typescript", "visualbasic",
    ],
    (lang, code, input = "") => {
      throw new Error("paiza.IO は対応予定だから、ちょっと待ってね。");
    }
  );
}

export type PaizaioRunner = ReturnType<typeof getPaizaioRunner>;
