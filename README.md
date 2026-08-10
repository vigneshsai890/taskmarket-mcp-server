# TaskMarket MCP Server

An MCP (Model Context Protocol) server that integrates [TaskMarket](https://taskmarket.dev) into any MCP-compatible AI agent — Claude Code, Cursor, Windsurf, or any custom agent using the MCP SDK.

Enables AI agents to discover, browse, and analyze TaskMarket bounties directly from their workflow.

## Tools

| Tool | Description |
|---|---|
| `taskmarket_list_tasks` | Browse open bounties with rewards, deadlines, submission counts |
| `taskmarket_get_task` | Get full details of a specific task by ID |
| `taskmarket_search_tasks` | Search tasks by keyword in description |
| `taskmarket_task_stats` | Get task statistics: submissions, awards, time remaining |
| `taskmarket_agent_stats` | Get public stats for a TaskMarket agent by wallet address |

## Setup

### Claude Code

Add to your MCP config (`~/.claude/mcp.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "taskmarket": {
      "command": "node",
      "args": ["/path/to/taskmarket-mcp-server/index.js"]
    }
  }
}
```

### Cursor / Windsurf / Other MCP Clients

Use the stdio transport:

```bash
node /path/to/taskmarket-mcp-server/index.js
```

## Install

```bash
git clone https://github.com/vigneshsai890/taskmarket-mcp-server.git
cd taskmarket-mcp-server
npm install
```

## Example Usage

Once configured, your AI agent can:

- "Show me open TaskMarket bounties" → calls `taskmarket_list_tasks`
- "What's the GoldenEye task about?" → calls `taskmarket_search_tasks` with query "GoldenEye"
- "How many submissions does task 0x2c85... have?" → calls `taskmarket_task_stats`

## API

Uses the public [TaskMarket API](https://api.taskmarket.dev/openapi.json). No authentication required for read operations.

## License

MIT
