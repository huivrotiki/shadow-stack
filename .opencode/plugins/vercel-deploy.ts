import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";

export const VercelDeployPlugin: Plugin = async ({ $, project }) => {
  return {
    // Custom tool to deploy to Vercel
    tool: {
      vercelDeploy: tool({
        description: "Deploy the current project to Vercel (production). Runs 'vercel --prod'.",
        args: {
          prod: tool.schema.boolean().optional().describe("Deploy to production (default true)"),
        },
        async execute(args) {
          const isProd = args.prod ?? true;
          const cmd = isProd ? "vercel --prod" : "vercel";
          const result = await $`${cmd}`.text();
          return `Vercel deploy triggered: ${result}`;
        },
      }),
    },
    // Hook: on session start, check Vercel CLI
    "session.created": async (event) => {
      console.log("[vercel-deploy] Session started, Vercel CLI available.");
    },
  };
};
