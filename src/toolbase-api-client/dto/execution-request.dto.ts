import { OmitType } from "@nestjs/mapped-types";
import { ClientTypesRequestDto } from "../dto/client-types-request.dto";
import { SlimDataDto } from "../dto/slim-data.dto";

export class ExecutionRequestDto extends OmitType(ClientTypesRequestDto, ['inputVariableNameIsFileName', 'outputVariableNameIsFileName']) {
    
    
    code: string;

    
    
    data: SlimDataDto;

    
    
    inputVariableNameOverride?: string;

    
    
    outputVariableNameOverride?: string;
}