import { IntersectionType, PickType } from "@nestjs/mapped-types";
import { CreateUserDto, UserDto } from "../dto/user.dto";

export class ChangePasswordDto extends IntersectionType(PickType(CreateUserDto, ['password']), PickType(UserDto, ['email'])) {
    
    oldPassword: string;
}