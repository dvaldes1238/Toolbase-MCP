export class OutputErrorDto {
    name: string;
    message: string;
    stack: string;
    exception: any;
    lineNumber: number;
    startColumn: number;
    endColumn: number;
    startPosition: number;
    endPosition: number;
    sourceLine: string;
    isTimeout?: boolean;
    isHost?: boolean;
    code?: string;
}

export class OutputDto {
    type: string;
    time: Date;
    message: string;
}

export class OutputValueDto {
    output: string;
    assertionFailures: string[] | undefined;
}

export class ExecutionResponseDto {
    value?: OutputValueDto;
    error?: OutputErrorDto | undefined;
    output?: OutputDto[] | undefined;
    logs: { [key: string]: string[] };
}