// SPDX-License-Identifier: MIT

import { GAS } from "../common";
import { RunResult, Runner } from ".";

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
      "lisp", "brainfuck", "text",
    ],
    (lang, code, input = "") => {
      // send request
      const langId: string =
        new Map([
          ["objectivec", "objective-c"],
          ["python2", "python"],
          ["python", "python3"],
          ["visualbasic", "vb"],
          ["lisp", "commonlisp"],
          ["naco", "nadesiko"],
          ["text", "plain"],
        ]).get(lang) ?? lang;
      const createRes: GAS.URL_Fetch.HTTPResponse = UrlFetchApp.fetch(
        "https://api.paiza.io/runners/create",
        {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify({
            api_key: "guest",
            source_code: code,
            language: langId,
            input: input,
            longpoll: true,
            longpoll_timeout: 10.0,
          }),
          muteHttpExceptions: true,
        }
      );
      if (createRes.getResponseCode() !== 200) {
        throw new Error(createRes.getContentText());
      }
      const createBody = JSON.parse(createRes.getContentText()) as
        | {
            id: string;
            status: "running" | "completed";
            error: undefined;
          }
        | { error: string };
      if (createBody.error != null) {
        throw new Error(createBody.error);
      }
      // get result
      const detailsRes: GAS.URL_Fetch.HTTPResponse = UrlFetchApp.fetch(
        "https://api.paiza.io/runners/get_details?" +
          `api_key=guest&id=${createBody.id}`,
        { method: "get", muteHttpExceptions: true }
      );
      if (detailsRes.getResponseCode() !== 200) {
        throw new Error(detailsRes.getContentText());
      }
      const details = JSON.parse(detailsRes.getContentText()) as
        | {
            id: string;
            language: string;
            note?: string;
            status: "running" | "completed";
            build_stdout?: string;
            build_stderr?: string;
            build_exit_code?: number;
            build_time?: string;
            build_memory?: number;
            build_result?: "success" | "failure" | "timeout";
            stdout?: string;
            stderr?: string;
            exit_code?: number;
            time?: string;
            memory?: number;
            connections?: number;
            result?: "success" | "failure" | "timeout";
            error: undefined;
          }
        | { error: string };
      if (details.error != null) {
        throw new Error(details.error);
      }
      // return result
      const result: RunResult = { status: "AC", stdout: "", stderr: "" };
      if (details.status !== "completed") {
        result.status = "IE";
      } else if (details.build_result && details.build_result !== "success") {
        result.status = "CE";
      } else if (details.result === "failure") {
        result.status = "RE";
      } else if (details.result === "timeout") {
        result.status = "TLE";
      }
      result.stdout += details.build_stdout ?? "";
      result.stderr += details.build_stderr ?? "";
      result.stdout += details.stdout ?? "";
      result.stderr += details.stderr ?? "";
      if (details.exit_code != null) {
        result.exitCode = `${details.exit_code}`;
      }
      if (details.time != null) {
        result.execTime = Number(details.time) * 1000;
      }
      if (details.memory != null) {
        result.memory = Number(details.memory) / 1000;
      }
      return result;
    }
  );
}

export type PaizaioRunner = ReturnType<typeof getPaizaioRunner>;
