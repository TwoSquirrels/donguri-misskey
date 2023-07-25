// SPDX-License-Identifier: MIT

import { Langs } from "./langs";
import { LocalRunner } from "./local-runner";
import { WandboxRunner } from "./wandbox-runner";
import { PaizaioRunner } from "./paizaio-runner";

declare const langs: Langs;
declare function getLocalRunner(names: string[]): LocalRunner;
declare function getWandboxRunner(names: string[]): WandboxRunner;
declare function getPaizaioRunner(names: string[]): PaizaioRunner;

export { Langs };

export type RunResult = {
  status: "AC" | "CE" | "RE" | "TLE" | "MLE" | "IE";
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
  local: getLocalRunner(["local", "gas"]),
  wandbox: getWandboxRunner(["wandbox", "wand", "wandbox.org"]),
  paizaio: getPaizaioRunner(["paiza.io", "paiza", "paizaio"]),
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
