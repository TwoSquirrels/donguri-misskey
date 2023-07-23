// SPDX-License-Identifier: MIT

const langs = {
  ada: { names: ["ada", "adb"] },
  assembly: { names: ["assemblyx64", "assembly", "asm"] },
  awk: { names: ["awk"] },
  bash: { names: ["bash", "bashscript", "sh", "shell", "shellscript"] },
  basic: { names: ["basic"] },
  bc: { names: ["bc"] },
  brainfuck: {
    names: ["brainfuck", "bf", "b", "brainf*ck", "brainfu*k", "brainf**k"],
  },
  c: { names: ["c", "clang", "c言語"] },
  carp: { names: ["carp"] },
  clojure: { names: ["clojure", "clj"] },
  cobol: { names: ["cobol", "cbl"] },
  coffeescript: { names: ["coffeescript", "coffee"] },
  cpp: { names: ["c++", "cpp", "cc", "cxx"] },
  crystal: { names: ["crystal", "cr"] },
  csharp: { names: ["c#", "csharp", "cs"] },
  cyber: { names: ["cyber", "cy"] },
  cython: { names: ["cython", "pyx"] },
  d: { names: ["d", "dlang", "d言語"] },
  dart: { names: ["dart"] },
  dc: { names: ["dc"] },
  deno: { names: ["deno"] },
  eclipse: { names: ["eclipse", "ecl"] },
  elixir: { names: ["elixir", "exs"] },
  emacslisp: { names: ["emacslisp", "emacs", "el"] },
  erlang: { names: ["erlang", "erl"] },
  factor: { names: ["factor"] },
  fish: { names: ["><>", "fish"] },
  forth: { names: ["forth"] },
  fortran: { names: ["fortran", "f90"] },
  fsharp: { names: ["f#", "fsharp", "fs"] },
  go: { names: ["go", "golang", "go言語"] },
  groovy: { names: ["groovy"] },
  haskell: { names: ["haskell", "hs"] },
  haxe: { names: ["haxe", "hx"] },
  java: {
    names: ["java", "30億のデバイスで走る言語", "30億のデバイスで動く言語"],
  },
  javascript: {
    names: ["javascript", "js", "cjs", "node", "nodejs", "node.js"],
  },
  jq: { names: ["jq"] },
  julia: { names: ["julia", "jl"] },
  koka: { names: ["koka", "kk"] },
  kotlin: { names: ["kotlin", "kt"] },
  lazyk: { names: ["lazyk", "lazy"] },
  lisp: { names: ["lisp", "神の言語"] },
  llvmir: { names: ["llvmir", "ll"] },
  lua: { names: ["lua"] },
  mercury: { names: ["mercury" /*, "m"*/] },
  mysql: { names: ["mysql", "sql"] },
  nako: {
    names: ["なでしこ", "ナデシコ", "nadesiko", "nadeshiko", "nako", "nako3"],
  },
  nibbles: { names: ["nibbles", "nbl"] },
  nim: { names: ["nim"] },
  objectivec: { names: ["objective-c", "objectivec", "m", "mm"] },
  ocaml: { names: ["ocaml", "ml"] },
  octave: { names: ["octave" /*, "m"*/] },
  openssl: { names: ["openssl", "ssl.sh"] },
  pascal: { names: ["pascal", "pas", "p"] },
  perl: { names: ["perl", "pl"] },
  php: { names: ["php"] },
  pony: { names: ["pony"] },
  powershell: { names: ["powershell", "pwsh", "ps1"] },
  produire: { names: ["プロデル", "ぷろでる", "produire", "rdr"] },
  prolog: { names: ["prolog"] },
  pypy: { names: ["pypy", "pypy3"] },
  pypy2: { names: ["pypy2"] },
  python: {
    names: ["python", "python3", "py", "py3", "cpython", "cpython3"],
  },
  python2: { names: ["python2", "py2", "cpython2"] },
  r: { names: ["r", "rlang", "r言語"] },
  raku: { names: ["raku", "p6"] },
  reasonml: { names: ["reasonml", "re", "reason"] },
  ruby: { names: ["ruby", "rb"] },
  rust: { names: ["rust", "rs"] },
  sagemath: { names: ["sagemath", "sage"] },
  scala: { names: ["scala"] },
  scheme: { names: ["scheme", "scm"] },
  sed: { names: ["sed"] },
  seed7: { names: ["seed7", "sd7"] },
  solidity: { names: ["solidity", "sol"] },
  sqlite: { names: ["sqlite" /*, "sql"*/] },
  swift: { names: ["swift"] },
  text: { names: ["text", "txt", "cat"] },
  typescript: { names: ["typescript", "ts", "cts", "ts-node"] },
  v: { names: ["v"] },
  vim: { names: ["vimscript", "vim"] },
  visualbasic: { names: ["visualbasic", "vb"] },
  whitespace: { names: ["whitespace", "ws"] },
  zig: { names: ["zig"] },
  zsh: { names: ["zsh"] },
} satisfies { [key: string]: { names: string[] } };

export type Langs = typeof langs;

function determineLang(name: string): keyof Langs | null {
  name = name.normalize("NFKC").toLowerCase();
  for (const l in langs) {
    if (langs[l as keyof Langs].names.includes(name)) {
      return l as keyof Langs;
    }
  }
  return null;
}

export type RunResult = {
  status: "OK" | "CE" | "RE" | "TLE" | "MLE" | "IE";
  stdout: string;
  stderr: string;
  exitCode?: string;
  execTime?: number;
  memory?: number;
};

export class Runner<L extends keyof Langs> {
  names: string[];
  langs: L[];
  run: (lang: L, code: string, input?: string) => RunResult;
  constructor(
    names: string[],
    langs: Runner<L>["langs"],
    run: Runner<L>["run"]
  ) {
    this.names = names;
    this.langs = langs;
    this.run = run;
  }
}

const runners = {
  local: new Runner(
    ["local", "gas"],
    ["text", "brainfuck"],
    (lang, code, input = "") => {
      switch (lang) {
        case "text":
          return { status: "OK", stdout: code, stderr: "", execTime: 0 };
        case "brainfuck":
          throw new Error("brainfuck は実装予定だから、ちょっと待ってね。");
      }
    }
  ),
  wandbox: new Runner(
    ["wandbox", "wand", "wandbox.org"],
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
  ),
  paizaio: new Runner(
    ["paiza.io", "paiza", "paizaio"],
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
  ),
} as const;

export type Runners = typeof runners;

function determineRunners({
  name,
  lang,
}: {
  name?: string;
  lang?: keyof Langs;
}): (keyof Runners)[] {
  name = name?.normalize("NFKC").toLowerCase();
  const availableRunners: (keyof Runners)[] = [];
  for (const runnerName in runners) {
    const runner = runners[runnerName as keyof Runners];
    if (name != null && !runner.names.includes(name)) {
      continue;
    }
    if (lang != null && !(runner.langs as (keyof Langs)[]).includes(lang)) {
      continue;
    }
    availableRunners.push(runnerName as keyof Runners);
  }
  return availableRunners;
}
