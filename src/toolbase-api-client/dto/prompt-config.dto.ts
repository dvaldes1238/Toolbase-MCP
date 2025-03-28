import { PartialType } from '@nestjs/mapped-types';
import { BaseToolConfigDto } from '../dto/base-tool-config.dto';
import { ToolType } from '../dto/tool-type.enum';

export class ToolCallDto {
    
    
    
    toolBranchId: number;

    
    
    toolName: string;

    
    
    toolSummary: string;

    
    isInput: boolean;

    
    
    nodeId?: string;
}

export class PromptConfigDto extends BaseToolConfigDto {

    
    
    promptSelectTool: boolean;

    
    
    promptExecuteTool: boolean;

    
    
    promptGenerateToolResponse: boolean;

    
    
    modelProvider: string;

    
    
    modelId: string;

    
    
    inputMessageTemplate: string;

    
    
    temperature?: number;

    
    
    seed?: number;

    
    
    
    
    tools?: ToolCallDto[];
}

export class UpdatePromptConfigDto extends PartialType(PromptConfigDto) {//don't use IntersectionType with BaseToolConfigDto as it causes an error in the browser
    
    
    readonly type: ToolType;
}
