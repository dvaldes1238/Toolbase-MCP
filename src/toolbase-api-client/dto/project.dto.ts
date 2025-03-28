import { UserDto } from "../dto/user.dto";

export class ProjectDto {
    id: number;
    name: string;
    createdBy: UserDto;
    createdAt: Date;
}