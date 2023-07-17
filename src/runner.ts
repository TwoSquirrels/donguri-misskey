// SPDX-License-Identifier: MIT

export interface RunResult {
  status: "OK" | "CE" | "RE" | "TLE" | "MLE" | "IE";
  stdout: string;
  stderr: string;
  exitCode?: string;
  execTime?: number;
  memory?: number;
}

export type Runner = (lang: string, code: string, input?: string) => RunResult;

const runners: { [key: string]: Runner } = {
  local: (lang: string, code: string, input: string = ""): RunResult => {
    return { status: "OK", stdout: code, stderr: "", execTime: 0 };
  },
};
