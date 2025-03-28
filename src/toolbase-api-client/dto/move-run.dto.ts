export class MoveRunDto {
    
    
    runId: string;

    
    
    fromDatasetId: number;

    
    
    toDatasetId: number;

    
    
    mergeStrategy: 'overwrite' | 'skip' | 'merge';
}