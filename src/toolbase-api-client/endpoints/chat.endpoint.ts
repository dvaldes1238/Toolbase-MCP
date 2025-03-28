import { JSONParser } from "@streamparser/json";
import { CoreMessage } from "ai";
import { CompletionDto } from "../dto/completion.dto";
import { ToolBranchDto } from "../dto/tool.dto";
import { ToolbaseApi } from "../toolbase";

export type ToolKey = Pick<ToolBranchDto, 'branchId'>;

export const DATA_IDS_DELIMITER_START = '\n<<||DATA_IDS||>>\n';
export const DATA_IDS_DELIMITER_END = '\n<<||END_DATA_IDS||>>\n';
export const INCLUDE_DATA_IDS_HEADER = 'X-INCLUDE-DATA-IDS';

export class ApiError extends Error {
    constructor(public messages: string[]) {
        super(messages.join('\n'));
        this.name = 'ApiError';
    }
}

export interface ToolCompletionChunk {
    type: 'TOOL';
    name: string;
    dotPath: number;
    chunk: string;
}

export interface JsonCompletionChunk {
    type: 'JSON';
    dotPath: string;
    chunk: string;
}

export interface TextCompletionChunk {
    type: 'TEXT';
    chunk: string;
}

export type CompletionsChunk = ToolCompletionChunk | JsonCompletionChunk | TextCompletionChunk;
export type CompletionsOverride = Partial<Omit<CompletionDto, 'initialInput' | 'additionalMessages'>>
export type StreamCallbacks = {
    dataIdsCallback?: (dataIds: { inputDataId: number, outputDataId: number }) => void;
}

const defaultCompletionsOptions = {
    vectorSearch: true,
    skipValidateInput: false,
    maxStackSize: 1,
} satisfies CompletionsOverride;

const stream = async <I extends string | { [keyof: string]: any }>(tool: ToolKey, initialInput: I, additionalMessages: CoreMessage[] = [], options: CompletionsOverride & StreamCallbacks = {}) => {
    options = { ...defaultCompletionsOptions, ...options };

    const initialInputString = typeof initialInput === 'string' ? initialInput : JSON.stringify(initialInput);

    const response: Response = await ToolbaseApi.config.fetch(`chat/${tool.branchId}`, {
        headers: options.dataIdsCallback ? {
            [INCLUDE_DATA_IDS_HEADER]: 'true',
        } : undefined,
        raw: true,
        method: 'POST',
        body: JSON.stringify({
            initialInput: initialInputString,
            additionalMessages,
            ...options
        }),
    });

    const type: 'TEXT' | 'JSON' = response.headers.get('Content-Type')?.includes('application/json') ? 'JSON' : 'TEXT';
    const runId = response.headers.get('x-run-id')!;

    const reader = response.body?.getReader();

    if (reader) {
        return {
            runId,
            type,
            [Symbol.asyncIterator]: async function* (): AsyncGenerator<string> {
                const decoder = new TextDecoder('utf-8');
                let inDataIdBuffer = false;
                let dataIdBuffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    if (inDataIdBuffer || options.dataIdsCallback && (chunk.includes(DATA_IDS_DELIMITER_START) || chunk.endsWith(DATA_IDS_DELIMITER_END))) {
                        inDataIdBuffer = true;

                        const delimiterStartIndex = chunk.indexOf(DATA_IDS_DELIMITER_START);

                        if (delimiterStartIndex !== -1) {
                            dataIdBuffer += chunk.substring(delimiterStartIndex + DATA_IDS_DELIMITER_START.length);
                            if (delimiterStartIndex !== 0) {
                                yield chunk.substring(0, delimiterStartIndex);
                            }
                        } else {//no start means were only waiting to receive the end
                            dataIdBuffer += chunk;
                        }

                        const delimiterEndIndex = dataIdBuffer.indexOf(DATA_IDS_DELIMITER_END);

                        if (delimiterEndIndex === -1) {
                            break;
                        }

                        dataIdBuffer = dataIdBuffer.substring(0, delimiterEndIndex);

                        let dataIds: { inputDataId: number, outputDataId: number };
                        try {
                            dataIds = JSON.parse(dataIdBuffer);
                        } catch (error) {
                            break;
                        }

                        options.dataIdsCallback?.(dataIds);
                        break;
                    }

                    // if (inToolCall) {
                    //     buffer += chunk;

                    //     let delimiterEndIndex = buffer.indexOf(TOOL_CALL_DELIMITER_END);
                    //     while (delimiterEndIndex !== -1) {
                    //         const toolCallJson = buffer.substring(
                    //             TOOL_CALL_DELIMITER_START.length,
                    //             delimiterEndIndex
                    //         );
                    //         buffer = buffer.substring(delimiterEndIndex + TOOL_CALL_DELIMITER_END.length);
                    //         delimiterEndIndex = buffer.indexOf(TOOL_CALL_DELIMITER_END);
                    //         console.log('toolCall', toolCallJson);
                    //         options.toolCallCallback?.(JSON.parse(toolCallJson));
                    //     }

                    //     const delimiterErrorEndIndex = buffer.indexOf(TOOL_CALL_ERROR_DELIMITER_END);
                    //     if (delimiterErrorEndIndex !== -1) {
                    //         const toolCallErrorJson = buffer.substring(
                    //             TOOL_CALL_ERROR_DELIMITER_START.length,
                    //             delimiterErrorEndIndex
                    //         );
                    //         buffer = buffer.substring(delimiterErrorEndIndex + TOOL_CALL_ERROR_DELIMITER_END.length);
                    //         console.log('toolCallError', toolCallErrorJson);
                    //         options.toolCallErrorCallback?.(JSON.parse(toolCallErrorJson));
                    //     }

                    //     const delimiterModeEndIndex = buffer.indexOf(TOOL_CALL_MODE_END);
                    //     if (delimiterModeEndIndex !== -1) {
                    //         inToolCall = false;
                    //         buffer = buffer.substring(delimiterModeEndIndex + TOOL_CALL_MODE_END.length);
                    //         console.log('toolCallModeEnd', buffer);
                    //         if (buffer.length > 0) yield buffer;
                    //     }
                    // } else {
                    // console.log('chunk', chunk);
                    yield chunk;
                    // }
                }
            },
            cancel: () => reader.cancel()
        };
    } else {
        throw new Error('Failed to read response');
    }
};

const streamObject = async <I extends string | { [keyof: string]: any }, O extends string | { [keyof: string]: any }>(tool: ToolKey, initialInput: I, additionalMessages: CoreMessage[] = [], options: CompletionsOverride & StreamCallbacks = {}) => {
    const iterator = await stream(tool, initialInput, additionalMessages, options);
    const parser = new JSONParser();

    let obj = {}, text = '';
    parser.onValue = ({ key, value, stack }) => {
        Object.assign(obj, stack[1]?.value as any);
    };

    return {
        runId: iterator.runId,
        type: iterator.type,
        [Symbol.asyncIterator]: async function* () {
            let parseError = false;
            for await (let chunk of iterator) {
                text += chunk;
                if (!parseError && iterator.type !== 'TEXT') {
                    try {
                        parser.write(chunk);
                        yield obj as O;
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        console.warn('Switching to TEXT mode');
                        parseError = true;
                        yield text as O;
                    }
                } else {
                    yield text as O;
                }
            }

            if (iterator.type !== 'TEXT') {
                try {
                    yield JSON.parse(text) as O;
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    console.warn('Switching to TEXT mode');
                    yield text as O;
                }
            }
        },
        cancel: () => iterator.cancel(),
    };

}

const completions = async <I extends string | { [keyof: string]: any }, O extends string | { [keyof: string]: any }>(tool: ToolKey, initialInput: I, additionalMessages: CoreMessage[] = [], options: CompletionsOverride & StreamCallbacks = {}) => {
    const iterator = await stream(tool, initialInput, additionalMessages, options);

    let text = '';
    for await (let chunk of iterator) {
        text += chunk;
    }

    let result: O;
    if (iterator.type === 'TEXT') {
        result = text as O;
    } else {
        try {
            result = JSON.parse(text) as O;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            console.warn('Switching to TEXT mode');
            iterator.type = 'TEXT';
            result = text as O;
        }
    }

    return {
        runId: iterator.runId,
        type: iterator.type,
        result
    };
};

export const chat = {
    stream,
    streamObject,
    completions
}