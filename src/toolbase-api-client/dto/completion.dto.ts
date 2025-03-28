import { CoreMessage } from "ai";
import { UpdateToolBranchDto } from "../dto/tool.dto";

export class CompletionDto {

    
    initialInput: string;

    
    
    additionalMessages?: CoreMessage[];

    
    
    skipValidateInput?: boolean;

    
    
    vectorSearch?: boolean;

    
    
    respondWithDataId?: boolean;

    
    
    maxStackSize?: number;

    
    
    includeLogProbs?: boolean;

    
    
    datasetId?: number;

    
    
    fewShotDatasetId?: number;

    
    
    skipValidateAndTemplate?: boolean;

    
    
    
    toolOverride?: UpdateToolBranchDto;

    
    
    
    parentToolOverride?: UpdateToolBranchDto;

    
    
    
    
    toolCallOverrides?: ToolCallOverrideDto[];
}

export class ToolCallOverrideDto extends UpdateToolBranchDto {
    
    branchId: number;
}