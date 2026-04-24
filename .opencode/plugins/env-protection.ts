import type { Plugin } from "@opencode-ai/plugin";

export const EnvProtectionPlugin: Plugin = async () => {
  return {
    // Hook: before file edit, check if file is .env
    "file.edited": async (event, context) => {
      const filePath = event.file || "";
      if (filePath.includes(".env") || filePath.includes("secret") || filePath.includes("credentials")) {
        console.warn(`[env-protection] Sensitive file edited: ${filePath}`);
        // Optionally block: context.output.status = "deny", context.output.reason = "Do not commit secrets";
      }
    },
    // Hook: before tool execute (e.g., bash commands that might expose secrets)
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash") {
        const cmd = input.args?.command || "";
        if (cmd.includes("GITHUB_TOKEN") || cmd.includes("API_KEY")) {
          output.args.command = "echo 'secrets filtered'";
        }
      }
    },
  };
};
