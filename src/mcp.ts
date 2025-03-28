import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { JSONSchema7 } from "json-schema";
import { McpProjectDto } from "./toolbase-api-client/dto/mcp-project.dto";
import { ParameterDto, ParameterRagType, ParameterType } from "./toolbase-api-client/dto/parameter.dto";
import { ToolbaseApi } from "./toolbase-api-client/toolbase";
import { ParameterUtil } from "./toolbase-api-client/util/parameter.util";

export const buildMcpServer = async (project: McpProjectDto) => {
    const mcp = new McpServer({
        name: project.name,
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {},
            // prompts: {},
        }
    });

    const tools = new Map<string, { name: string, description: string, inputSchema: JSONSchema7 }>();

    project.tools.forEach(branch => {
        const toolName = ParameterUtil.toCamelCase(branch.fileName) + '_' + branch.branchId;

        tools.set(toolName, {
            name: toolName,
            description: branch.summary,
            inputSchema: ParameterUtil.parametersToJSONSchema(branch.inputIsStructured ? branch.inputParameters : [{
                uuid: '',
                name: 'input',
                description: 'Input parameter for the tool',
                type: ParameterType.STRING,
                isRequired: true,
                isArray: false,
                ragType: ParameterRagType.NONE,
            } satisfies ParameterDto]),
        });
    });

    mcp.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
        return { tools: Array.from(tools.values()) };
    });

    mcp.server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const tool = tools.get(request.params.name);

        if (!tool) {
            throw new Error(`Tool ${request.params.name} not found`);
        }

        const branchId = request.params.name.split('_')[1];

        if (!branchId) {
            throw new Error(`Tool branch ID not found in tool name ${request.params.name}`);
        }

        if (request.params.arguments === undefined) {
            throw new Error(`Arguments required for tool ${request.params.name}`);
        }

        const response = await ToolbaseApi.chat.completions({ branchId: parseInt(branchId) }, request.params.arguments);

        return {
            content: [
                {
                    type: 'text',
                    text: response.type === 'TEXT' ? response.result : JSON.stringify(response.result),
                },
            ],
        };
    });

    return mcp;
}