import { OmitType } from "@nestjs/mapped-types";
import { FileDto } from "../dto/file.dto";
import { ToolBranchDto } from "../dto/tool.dto";

export class McpProjectDto extends OmitType(FileDto, ['parentId', 'path', 'toolBranches']) {
    
    
    
    tools: ToolBranchDto[];
}