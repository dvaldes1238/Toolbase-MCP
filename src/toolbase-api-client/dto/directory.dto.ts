import { OmitType, PartialType } from "@nestjs/mapped-types";
import { UserDto } from "../dto/user.dto";

export class DirectoryDto {
    
    
    readonly id: number;

    
    
    readonly name: string;

    
    
    
    readonly parentId: number | null;

    
    
    readonly path: string;

    
    readonly createdAt: Date;

    
    readonly updatedAt: Date;

    
    
    
    readonly createdBy: UserDto;

    
    readonly isFolder: boolean = true;
}

export class CreateDirectoryDto extends OmitType(DirectoryDto, ['id', 'createdAt', 'createdBy', 'updatedAt', 'path', 'isFolder']) { }
export class UpdateDirectoryDto extends PartialType(CreateDirectoryDto) { }