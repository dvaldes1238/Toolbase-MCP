import { OmitType, PartialType } from "@nestjs/mapped-types";
import { UserDto } from "../dto/user.dto";

export class DataDto {
    
    
    readonly id: number;

    
    
    readonly datasetId: number;

    
    readonly createdAt: Date;

    
    readonly updatedAt: Date;

    
    
    readonly generatedByToolBranchId: number | null;

    
    
    readonly runId: string;

    
    
    readonly input: string;

    
    
    readonly output: string;

    
    
    readonly reasoning: string[];

    
    
    readonly assertionFailures: { [key: number]: string[] };

    
    
    readonly evaluationResults: { [key: number]: any };

    
    
    readonly step: number;

    
    readonly wasRunResponder: boolean;

    
    
    readonly tags: string[];

    
    
    readonly createdBy: UserDto | null;
}

export class CreateDataDto extends OmitType(DataDto, ['id', 'createdAt', 'createdBy', 'updatedAt']) { }
export class UpdateDataDto extends PartialType(OmitType(CreateDataDto, ['input'])) { }