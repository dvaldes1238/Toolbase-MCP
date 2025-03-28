import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';

export class UserDto {
    
    
    
    readonly id: number;

    
    
    
    readonly name: string;

    
    
    readonly email: string;

    
    
    readonly phone: string | null;

    
    
    
    readonly createdAt: Date;
}

export class CreateUserDto extends OmitType(UserDto, ['id', 'createdAt']) {
    
    
    
    password: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) { }

export class LoginUserDto extends PickType(UserDto, ['email']) {
    
    password: string;
}