#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import { buildMcpServer } from './mcp';
import { ToolbaseApi } from './toolbase-api-client/toolbase';

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node src/index.ts <api-token> [endpoint]');
    process.exit(1);
}
const apiToken = args[0];

const endpoint: string | undefined = args[1];

dotenv.config({ path: resolve(__dirname, '../.env') });
ToolbaseApi.configure({ baseUrl: endpoint ?? 'https://api.gettoolbase.com', apiToken: apiToken });

async function main() {
    const project = await ToolbaseApi.mcp.getProject();

    const mcp = await buildMcpServer(project);

    const transport = new StdioServerTransport();
    await mcp.connect(transport).catch((error) => {
        console.error(error);
    });
}

main();