export enum ParameterType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    DATE = 'date',
    OBJECT = 'object',
    ENUM = 'enum',
}

export enum ParameterRagType {
    NONE = 'N/A',
    TAG = 'Tag',
    VECTOR = 'Vec'
}

export class ParameterDto {
    
    
    
    uuid: string;

    
    name: string;

    
    description: string;

    
    
    type: ParameterType;

    
    
    isRequired: boolean;

    
    
    isArray: boolean;

    
    
    ragType: ParameterRagType;

    
    
    
    subProperties?: ParameterDto[];
}
