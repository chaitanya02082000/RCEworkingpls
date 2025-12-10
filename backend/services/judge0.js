import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "http://localhost:2358";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

const LANGUAGE_IDS = {
  javascript: 63,
  js: 63,
  python: 71,
  python3: 71,
  java: 62,
  cpp: 54,
  "c++": 54,
  c: 50,
};

class Judge0Service {
  constructor() {
    this.apiUrl = JUDGE0_API_URL;
    this.apiKey = JUDGE0_API_KEY;

    const headers = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["X-RapidAPI-Key"] = this.apiKey;
      headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
    }

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: headers,
    });
  }

  getLanguageId(language) {
    const langId = LANGUAGE_IDS[language.toLowerCase()];
    if (!langId) {
      throw new Error("Unsupported language: " + language);
    }
    return langId;
  }

  async submitCode(code, language, stdin) {
    try {
      const languageId = this.getLanguageId(language);

      const response = await this.client.post(
        "/submissions",
        {
          source_code: Buffer.from(code).toString("base64"),
          language_id: languageId,
          stdin: stdin ? Buffer.from(stdin).toString("base64") : null,
          cpu_time_limit: 10,
          memory_limit: 256000,
          max_file_size: 1024,
        },
        {
          params: {
            base64_encoded: true,
            wait: false,
          },
        },
      );

      return response.data.token;
    } catch (error) {
      console.error(
        "Judge0 submission error:",
        error.response?.data || error.message,
      );
      throw new Error("Failed to submit code for execution");
    }
  }

  async getSubmission(token, maxRetries) {
    if (!maxRetries) maxRetries = 10;

    for (var i = 0; i < maxRetries; i++) {
      var response;

      try {
        response = await this.client.get("/submissions/" + token, {
          params: {
            base64_encoded: true,
            fields: "*",
          },
        });
      } catch (error) {
        console.error(
          "Judge0 get submission error:",
          error.response?.data || error.message,
        );
        throw new Error("Failed to get execution result");
      }

      var submission = response.data;

      if (submission.status.id <= 2) {
        await this.sleep(1000);
        continue;
      }

      return this.parseResult(submission);
    }

    throw new Error("Execution timeout: Code took too long to execute");
  }

  parseResult(submission) {
    var status = submission.status;

    var stdout = "";
    var stderr = "";
    var compileOutput = "";
    var message = "";

    if (submission.stdout) {
      try {
        stdout = Buffer.from(submission.stdout, "base64").toString("utf-8");
      } catch (e) {
        stdout = submission.stdout;
      }
    }

    if (submission.stderr) {
      try {
        stderr = Buffer.from(submission.stderr, "base64").toString("utf-8");
      } catch (e) {
        stderr = submission.stderr;
      }
    }

    if (submission.compile_output) {
      try {
        compileOutput = Buffer.from(
          submission.compile_output,
          "base64",
        ).toString("utf-8");
      } catch (e) {
        compileOutput = submission.compile_output;
      }
    }

    if (submission.message) {
      try {
        message = Buffer.from(submission.message, "base64").toString("utf-8");
      } catch (e) {
        message = submission.message;
      }
    }

    // Log for debugging
    console.log("Judge0 Result:", {
      statusId: status.id,
      statusDesc: status.description,
      stdout: stdout ? stdout.substring(0, 100) : "(empty)",
      stderr: stderr ? stderr.substring(0, 100) : "(empty)",
      compileOutput: compileOutput
        ? compileOutput.substring(0, 100)
        : "(empty)",
      message: message ? message.substring(0, 100) : "(empty)",
      exitCode: submission.exit_code,
      exitSignal: submission.exit_signal,
    });

    switch (status.id) {
      case 3: // Accepted
        return {
          success: true,
          output: stdout || "Program executed successfully (no output)",
          time: submission.time,
          memory: submission.memory,
        };

      case 4: // Wrong Answer
        return {
          success: true,
          output: stdout || stderr || "Program completed",
          time: submission.time,
          memory: submission.memory,
        };

      case 5: // Time Limit Exceeded
        throw new Error(
          "Time Limit Exceeded\n\n" +
            "Your code took too long to execute (limit: 10 seconds).\n\n" +
            "Common causes:\n" +
            "  - Infinite loop\n" +
            "  - Inefficient algorithm\n" +
            "  - Waiting for input that wasn't provided" +
            (stdout ? "\n\nPartial output:\n" + stdout : ""),
        );

      case 6: // Compilation Error
        throw new Error(
          "Compilation Error\n\n" +
            (compileOutput || "Unknown compilation error"),
        );

      case 7: // Runtime Error (SIGSEGV)
        throw new Error(
          "Segmentation Fault (SIGSEGV)\n\n" +
            "Your program tried to access invalid memory.\n\n" +
            "Common causes:\n" +
            "  - Array index out of bounds\n" +
            "  - Null pointer dereference\n" +
            "  - Stack overflow (infinite recursion)" +
            (stderr ? "\n\nDetails:\n" + stderr : ""),
        );

      case 8: // Runtime Error (SIGXFSZ)
        throw new Error(
          "Output Limit Exceeded (SIGXFSZ)\n\n" +
            "Your program produced too much output.",
        );

      case 9: // Runtime Error (SIGFPE)
        throw new Error(
          "Floating Point Exception (SIGFPE)\n\n" +
            "Common causes:\n" +
            "  - Division by zero\n" +
            "  - Integer overflow" +
            (stderr ? "\n\nDetails:\n" + stderr : ""),
        );

      case 10: // Runtime Error (SIGABRT)
        throw new Error(
          "Program Aborted (SIGABRT)\n\n" +
            "Your program called abort() or failed an assertion." +
            (stderr ? "\n\nDetails:\n" + stderr : ""),
        );

      case 11: // Runtime Error (NZEC) - Most common for JS/Python errors
        // Build error message from available sources
        var errorMsg = stderr || compileOutput || message || "";

        if (errorMsg) {
          throw new Error("Runtime Error\n\n" + errorMsg);
        } else {
          throw new Error(
            "Runtime Error (Exit Code: " +
              (submission.exit_code || "non-zero") +
              ")\n\n" +
              "Your program exited with an error." +
              (stdout ? "\n\nOutput before error:\n" + stdout : ""),
          );
        }

      case 12: // Runtime Error (Other)
        var errorDetail = stderr || compileOutput || message || "";

        if (errorDetail) {
          throw new Error("Runtime Error\n\n" + errorDetail);
        } else {
          throw new Error(
            "Runtime Error\n\n" +
              "An unknown error occurred during execution." +
              (stdout ? "\n\nOutput before error:\n" + stdout : ""),
          );
        }

      case 13: // Internal Error
        throw new Error(
          "Internal Error\n\n" +
            "The code execution service encountered an error.  Please try again.",
        );

      case 14: // Exec Format Error
        throw new Error(
          "Execution Format Error\n\n" +
            "The compiled program could not be executed." +
            (compileOutput ? "\n\nDetails:\n" + compileOutput : ""),
        );

      default:
        // Try to find any error information
        var anyError = stderr || compileOutput || message || "";

        if (anyError) {
          throw new Error("Error\n\n" + anyError);
        }

        // No error found, return success with whatever output we have
        return {
          success: true,
          output: stdout || "Status: " + status.description,
          time: submission.time,
          memory: submission.memory,
        };
    }
  }

  async execute(code, language, stdin) {
    var token = await this.submitCode(code, language, stdin || "");
    var result = await this.getSubmission(token);
    return result;
  }

  sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }
}

export default new Judge0Service();
