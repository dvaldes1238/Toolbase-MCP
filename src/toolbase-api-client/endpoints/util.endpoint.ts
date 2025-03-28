import { ClientTypesRequestDto } from "../dto/client-types-request.dto";
import { CompileRequestDto } from "../dto/compile-request.dto";
import { CompileResponseDto } from "../dto/compile-response.dto";
import { ExecutionRequestDto } from "../dto/execution-request.dto";
import { ExecutionResponseDto } from "../dto/execution-response.dto";
import { ToolbaseApi } from "../toolbase";

export const util = {
    clientTypes: async (toolId: number, dto: ClientTypesRequestDto) => {
        return await ToolbaseApi.config.fetch(`util/client-types/${toolId}`, {
            method: 'POST',
            body: JSON.stringify(dto)
        }) as Promise<string>;
    },
    compile: async (dto: CompileRequestDto) => {
        return await ToolbaseApi.config.fetch('util/compile', {
            method: 'POST',
            body: JSON.stringify(dto)
        }) as Promise<CompileResponseDto>;
    },
    executeAssertions: async (dto: ExecutionRequestDto) => {
        return await ToolbaseApi.config.fetch('util/execute-assertions', {
            method: 'POST',
            body: JSON.stringify(dto)
        }) as Promise<ExecutionResponseDto>;
    },
}