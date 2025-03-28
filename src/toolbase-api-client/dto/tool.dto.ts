import { IntersectionType, OmitType, PartialType, PickType } from "@nestjs/mapped-types";
import { UserDto } from "../dto/user.dto";
import { DatasetDto } from "../dto/dataset.dto";
import { BaseToolConfigDto } from "../dto/base-tool-config.dto";
import { CodeConfigDto, UpdateCodeConfigDto } from "../dto/code-config.dto";
import { EvalDto } from "../dto/eval.dto";
import { ParameterDto } from "../dto/parameter.dto";
import { PromptConfigDto, UpdatePromptConfigDto } from "../dto/prompt-config.dto";
import { ToolType } from "../dto/tool-type.enum";
import { UpdateWorkflowConfigDto, WorkflowConfigDto } from "../dto/workflow-config.dto";

export class ToolBranchDto {
    
    
    readonly fileId: number;

    
    
    readonly branchId: number;

    
    
    readonly fileName: string;

    
    readonly createdAt: Date;

    
    readonly updatedAt: Date;

    
    
    readonly createdBy: UserDto;

    
    
    readonly branchName: string;

    
    
    readonly summary: string;

    
    readonly inputIsStructured: boolean;

    
    readonly outputIsStructured: boolean;

    
    readonly code: string;

    
    
    
    readonly inputParameters: ParameterDto[];

    
    
    
    readonly outputParameters: ParameterDto[];

    
    
    readonly defaultApprovedDatasetId: number | null;

    
    
    readonly defaultDatasetId: number | null;

    
    
    
    readonly inputAssertions: EvalDto[];

    
    
    
    readonly outputAssertions: EvalDto[];

    
    
    
    readonly config: PromptConfigDto | CodeConfigDto | WorkflowConfigDto;

    
    
    
    
    readonly datasets: ToolBranchDatasetDto[];
}

export class ToolBranchDatasetDto extends PickType(DatasetDto, ['id', 'name', 'description']) { }
export class CreateToolBranchDatasetDto extends OmitType(ToolBranchDatasetDto, ['id']) { }

export class CreateToolBranchDto extends OmitType(ToolBranchDto, ['branchId', 'createdAt', 'updatedAt', 'createdBy', 'fileId', 'defaultApprovedDatasetId', 'defaultDatasetId', 'fileName', 'datasets']) {
    
    
    
    
    
    readonly datasets?: CreateToolBranchDatasetDto[];
}

export class UpdateToolBranchDto extends PartialType(IntersectionType(OmitType(CreateToolBranchDto, ['config']), PickType(ToolBranchDto, ['defaultApprovedDatasetId', 'defaultDatasetId', 'datasets']))) {
    
    
    
    readonly config?: UpdatePromptConfigDto | UpdateCodeConfigDto | UpdateWorkflowConfigDto;
}

