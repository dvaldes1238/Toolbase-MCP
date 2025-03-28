import { OmitType, PartialType } from "@nestjs/mapped-types";
import { UserDto } from "../dto/user.dto";

export class DatasetDto {
    
    
    readonly id: number;

    
    
    readonly fileId: number;

    
    
    
    readonly toolBranchId: number | null;

    
    readonly createdAt: Date;

    
    readonly updatedAt: Date;

    
    
    
    readonly name: string;

    
    
    readonly description: string;

    
    
    
    readonly createdBy: UserDto;
}

export class CreateDatasetDto extends OmitType(DatasetDto, ['id', 'createdAt', 'createdBy', 'updatedAt']) { }
export class UpdateDatasetDto extends PartialType(CreateDatasetDto) { }