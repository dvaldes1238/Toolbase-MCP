import { McpProjectDto } from "../dto/mcp-project.dto"
import { ToolbaseApi } from "../toolbase"

export const mcp = {
    getProject: async (): Promise<McpProjectDto> => {
        return await ToolbaseApi.config.fetch(`mcp`, {
            method: 'GET'
        })
    }
}