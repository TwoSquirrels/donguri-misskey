// SPDX-License-Identifier: MIT

import { GAS } from "../common";
import { RunResult, Runner } from ".";

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
      // select compiler
      const listRes: GAS.URL_Fetch.HTTPResponse = UrlFetchApp.fetch(
        "https://wandbox.org/api/list.json",
        { method: "get", muteHttpExceptions: true }
      );
      if (listRes.getResponseCode() !== 200) {
        throw new Error(listRes.getContentText());
      }
      const langName: string = {
        bash: "Bash script",
        c: "C",
        csharp: "C#",
        cpp: "C++",
        crystal: "Crystal",
        d: "D",
        elixir: "Elixir",
        erlang: "Erlang",
        go: "Go",
        groovy: "Groovy",
        haskell: "Haskell",
        java: "Java",
        javascript: "JavaScript",
        julia: "Julia",
        lazyk: "Lazy K",
        lisp: "Lisp",
        lua: "Lua",
        nim: "Nim",
        ocaml: "OCaml",
        openssl: "OpenSSL",
        pascal: "Pascal",
        perl: "Perl",
        php: "PHP",
        pony: "Pony",
        pypy: "Python",
        pypy2: "Python",
        python: "Python",
        python2: "Python",
        r: "R",
        ruby: "Ruby",
        rust: "Rust",
        scala: "Scala",
        sqlite: "SQL",
        swift: "Swift",
        typescript: "TypeScript",
        vim: "Vim script",
        zig: "Zig",
      }[lang];
      // TODO: ACL
      let boostFlag = ""; // cpp only
      const compiler = (
        JSON.parse(listRes.getContentText()) as {
          name: string;
          version: string;
          language: string;
          "display-name": string;
          templates: string[];
          "compiler-option-raw": boolean;
          "runtime-option-raw": boolean;
          "display-compile-command": string;
          switches: (
            | {
                type: "single";
                name: string;
                "display-name": string;
                "display-flags": string;
                default: boolean;
              }
            | {
                type: "select";
                name: string;
                options: {
                  name: string;
                  "display-name": string;
                  "display-flags": string;
                }[];
                default: boolean;
              }
          )[];
        }[]
      ).filter((compiler) => {
        if (compiler.language !== langName) return false;
        if (langName === "C++") {
          if (!compiler.name.match(/gcc-/i)) return false;
          const boostSwitch = compiler.switches.find(
            (s) =>
              s.type === "select" &&
              s.name.match(/boost/i) &&
              s.options.some((o) => o["display-flags"])
          );
          if (boostSwitch == null) return false;
          if (!boostFlag && boostSwitch.type === "select") {
            boostFlag = boostSwitch.options.find(
              (option) => option["display-flags"]
            )!["display-flags"];
          }
        }
        if (langName === "Python") {
          switch (lang) {
            case "pypy":
              if (!compiler.name.match(/pypy-3/i)) return false;
              break;
            case "pypy2":
              if (!compiler.name.match(/pypy-2/i)) return false;
              break;
            case "python":
              if (!compiler.name.match(/cpython-3/i)) return false;
              break;
            case "python2":
              if (!compiler.name.match(/cpython-2/i)) return false;
              break;
          }
        }
        return true;
      })[0];
      if (!compiler) {
        throw new Error(`Wandbox に ${langName} 言語が対応してないっぽい。`);
      }
      // compile
      // TODO: measure execution time
      const compileRes: GAS.URL_Fetch.HTTPResponse = UrlFetchApp.fetch(
        "https://wandbox.org/api/compile.json",
        {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify({
            compiler: compiler.name,
            code: code,
            //options: "",
            stdin: input,
            "compiler-option-raw": (lang === "cpp"
              ? ["-O2", "-march=native", boostFlag]
              : []
            ).join("\n"),
            //"Runtime-option-raw": "",
          }),
          muteHttpExceptions: true,
        }
      );
      if (compileRes.getResponseCode() !== 200) {
        throw new Error(compileRes.getContentText());
      }
      const compileResult = JSON.parse(compileRes.getContentText()) as {
        status: string;
        signal?: string;
        compiler_output: string;
        compiler_error: string;
        compiler_message: string;
        program_output: string;
        program_error: string;
        program_message: string;
      };
      // return result
      const result: RunResult = { status: "AC", stdout: "", stderr: "" };
      result.langName = langName;
      result.langName += ` (${compiler["display-name"]} ${compiler.version})`;
      if (Number(compileResult.status) !== 0) {
        result.status = compileResult.compiler_message ? "CE" : "RE";
      }
      result.stdout += compileResult.compiler_output;
      result.stderr += compileResult.compiler_error;
      result.stdout += compileResult.program_output;
      result.stderr += compileResult.program_error;
      result.exitCode = compileResult.status;
      if (compileResult.signal) {
        result.exitCode += ` (${compileResult.signal})`;
      }
      return result;
    }
  );
}

export type WandboxRunner = ReturnType<typeof getWandboxRunner>;
