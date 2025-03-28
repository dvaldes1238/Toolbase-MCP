import { InputMapValue } from "../dto/node-types.dto";

export enum AssertionsType {
    TEMPLATE = "TEMPLATE",
    CODE = "CODE",
}

export class EvalDto {
    
    
    branchId: number;

    
    
    
    
    inputMap: Record<string, InputMapValue>; 

    
    assertionsType: AssertionsType;

    
    assertions: string;
}