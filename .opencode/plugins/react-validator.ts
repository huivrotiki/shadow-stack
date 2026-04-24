import type { Plugin } from "@opencode-ai/plugin";

export const ReactValidatorPlugin: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      // Only check write/edit tools
      if (input.tool !== "write" && input.tool !== "edit") return;
      const filePath = input.args?.filePath || input.args?.path || "";
      if (!filePath.endsWith(".jsx") && !filePath.endsWith(".tsx")) return;
      // Simple check: warn if component missing key prop in map
      const content = input.args?.content || input.args?.newString || "";
      if (content.includes(".map(") && !content.includes("key=")) {
        console.warn("[react-validator] Possible missing key prop in map.");
      }
    },
    "tool.execute.after": async (input, output) => {
      // Could run eslint on file after edit, but skip for now
    },
  };
};
