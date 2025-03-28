import { UpdateToolBranchDto } from "../dto/tool.dto";

export class ClientTypesRequestDto {
    
    includeInput: boolean;

    
    includeOutput: boolean;

    
    includeAssert: boolean;

    
    includeUser: boolean;

    
    
    inputVariableNameIsFileName?: boolean;

    
    
    outputVariableNameIsFileName?: boolean;

    
    
    
    changes?: UpdateToolBranchDto;

    
    
    nodeId?: string;
}
