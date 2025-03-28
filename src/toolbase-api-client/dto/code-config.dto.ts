import { IntersectionType, PartialType } from "@nestjs/mapped-types";
import { BaseToolConfigDto } from "../dto/base-tool-config.dto";
import { ToolType } from "../dto/tool-type.enum";

export enum CodeLanguage {
    PYTHON = 'python',
    TYPESCRIPT = 'typescript',
    JAVASCRIPT = 'javascript',
}

export class CodeConfigDto extends BaseToolConfigDto {
    
    
    language: CodeLanguage;
}

export class UpdateCodeConfigDto extends PartialType(CodeConfigDto) { //don't use IntersectionType with BaseToolConfigDto as it causes an error in the browser
    
    
    readonly type: ToolType;
}
