// SPDX-License-Identifier: MIT

const langs = {
  brainfuck: {
    names: ["brainfuck", "bf", "brainf*ck", "brainfu*k", "brainf**k"],
  },
  c: { names: ["c"] },
  cpp: { names: ["c++", "cpp", "cc", "cxx"] },
  python2: { names: ["python2", "py2"] },
  python3: { names: ["python", "python3", "py", "py3"] },
  text: { names: ["text", "txt", "cat"] },
} satisfies { [key: string]: { names: string[] } };

export type Langs = typeof langs;

function determineLang(s: string): keyof Langs | null {
  for (const l in langs) {
    if (langs[l as keyof Langs].names.includes(s)) {
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
  langs: L[];
  run: (lang: L, code: string, input?: string) => RunResult;
  constructor(langs: Runner<L>["langs"], run: Runner<L>["run"]) {
    this.langs = langs;
    this.run = run;
  }
}

const runners = {
  local: new Runner(["text", "brainfuck"], (lang, code, input = "") => {
    switch (lang) {
      case "text":
        return { status: "OK", stdout: code, stderr: "", execTime: 0 };
      case "brainfuck":
        throw new Error("brainfuck は実装予定だから、ちょっと待ってね。");
    }
  }),
  wandbox: new Runner(["c", "cpp"], (lang, code, input = "") => {
    throw new Error("Wandbox は対応予定だから、ちょっと待ってね。");
  }),
  paizaio: new Runner(["c", "cpp"], (lang, code, input = "") => {
    throw new Error("PaizaIO は対応予定だから、ちょっと待ってね。");
  }),
} as const;

export type Runners = typeof runners;

function determineRunners(lang: keyof Langs): (keyof Runners)[] {
  return (Object.entries(runners) as [keyof Runners, Runners[keyof Runners]][])
    .filter(([, runner]) => (runner.langs as (keyof Langs)[]).includes(lang))
    .map(([name]) => name);
}
