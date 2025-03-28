import { PickType } from "@nestjs/mapped-types";
import { ToolType } from "../dto/tool-type.enum";
import { ToolBranchDto } from "../dto/tool.dto";


export class SearchResultResponseDto extends PickType(ToolBranchDto, ['fileId', 'branchId', 'fileName', 'branchName', 'summary']) {
    
    readonly similarity: number;

    
    
    readonly toolType: ToolType;
}
