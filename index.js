#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API = "https://api.taskmarket.dev";

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  return res.json();
}

const server = new McpServer({
  name: "taskmarket",
  version: "1.0.0",
  capabilities: { tools: {} },
});

server.tool(
  "taskmarket_list_tasks",
  "Browse open TaskMarket bounties and tasks. Returns task IDs, rewards, deadlines, submission counts, and descriptions.",
  { limit: z.number().optional().describe("Max tasks to return (default 10)"), tag: z.string().optional().describe("Filter by tag") },
  async ({ limit, tag }) => {
    const params = new URLSearchParams({ limit: String(limit || 10), status: "open" });
    if (tag) params.set("tag", tag);
    const data = await api(`/tasks?${params}`);
    if (!data.ok) return { content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }] };
    const tasks = data.data.tasks.map(t => ({
      id: t.id,
      reward: `${(parseInt(t.reward) / 1e6).toFixed(2)} USDC`,
      netReward: `${(parseInt(t.netReward) / 1e6).toFixed(2)} USDC`,
      expires: t.expiryTime,
      submissions: t.submissionCount,
      mode: t.mode,
      tags: t.tags,
      description: t.description.slice(0, 200),
    }));
    return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] };
  }
);

server.tool(
  "taskmarket_get_task",
  "Get full details of a specific TaskMarket task by ID.",
  { taskId: z.string().describe("Task ID (0x-prefixed hex)") },
  async ({ taskId }) => {
    const data = await api(`/tasks/${taskId}`);
    if (!data.ok) return { content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }] };
    const t = data.data;
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          id: t.id,
          description: t.description,
          reward: `${(parseInt(t.reward) / 1e6).toFixed(2)} USDC`,
          netReward: `${(parseInt(t.netReward) / 1e6).toFixed(2)} USDC`,
          expires: t.expiryTime,
          status: t.status,
          mode: t.mode,
          tags: t.tags,
          submissions: t.submissionCount,
          awards: t.awardCount,
          submissionWindowOpen: t.submissionWindowOpen,
        }, null, 2),
      }],
    };
  }
);

server.tool(
  "taskmarket_search_tasks",
  "Search TaskMarket tasks by keyword in description.",
  { query: z.string().describe("Search keyword"), limit: z.number().optional() },
  async ({ query, limit }) => {
    const data = await api(`/tasks?limit=${limit || 20}&status=open`);
    if (!data.ok) return { content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }] };
    const matches = data.data.tasks.filter(t =>
      t.description.toLowerCase().includes(query.toLowerCase())
    );
    const results = matches.map(t => ({
      id: t.id,
      reward: `${(parseInt(t.reward) / 1e6).toFixed(2)} USDC`,
      expires: t.expiryTime,
      submissions: t.submissionCount,
      snippet: t.description.slice(0, 150),
    }));
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "taskmarket_task_stats",
  "Get statistics about a task: submission count, award count, time remaining.",
  { taskId: z.string().describe("Task ID (0x-prefixed hex)") },
  async ({ taskId }) => {
    const data = await api(`/tasks/${taskId}`);
    if (!data.ok) return { content: [{ type: "text", text: `Error: ${JSON.stringify(data)}` }] };
    const t = data.data;
    const now = Date.now();
    const exp = new Date(t.expiryTime).getTime();
    const hoursLeft = Math.max(0, (exp - now) / 3600000).toFixed(1);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          id: t.id,
          status: t.status,
          reward: `${(parseInt(t.reward) / 1e6).toFixed(2)} USDC`,
          submissions: t.submissionCount,
          awards: t.awardCount,
          hoursRemaining: hoursLeft,
          submissionWindowOpen: t.submissionWindowOpen,
          phase: t.phase,
        }, null, 2),
      }],
    };
  }
);

server.tool(
  "taskmarket_agent_stats",
  "Get public stats for a TaskMarket agent by wallet address.",
  { address: z.string().describe("Agent wallet address (0x...)") },
  async ({ address }) => {
    const data = await api(`/agents/${address}/stats`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
