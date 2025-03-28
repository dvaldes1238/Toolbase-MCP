import { OmitType, PartialType, PickType } from "@nestjs/mapped-types";
import { UserDto } from "../dto/user.dto";
import { ToolType } from "../dto/tool-type.enum";
import { ToolBranchDto } from "../dto/tool.dto";

export class FileDto {
    
    
    readonly id: number;

    
    
    readonly name: string;

    
    readonly parentId: number;

    
    
    readonly path: string;

    
    readonly createdAt: Date;

    
    
    
    readonly createdBy: UserDto;

    
    
    
    
    
    
    readonly toolBranches: FileToolBranchDto[];

    
    readonly isFolder: boolean = false;
}

export class FileToolBranchDto extends PickType(ToolBranchDto, ['branchId', 'branchName']) {
    
    
    readonly toolType: ToolType;
}
export class CreateFileToolBranchDto extends OmitType(FileToolBranchDto, ['branchId']) { }

export class CreateFileDto extends OmitType(FileDto, ['id', 'createdAt', 'createdBy', 'path', 'isFolder', 'toolBranches']) {
    
    
    
    
    
    readonly toolBranches: CreateFileToolBranchDto[];
}
export class UpdateFileDto extends PartialType(CreateFileDto) { }

