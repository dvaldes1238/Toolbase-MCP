import { ToolBranchDto } from "../dto/tool.dto";
import { ParameterDto, ParameterRagType, ParameterType } from "../dto/parameter.dto";
import { PromptConfigDto } from "../dto/prompt-config.dto";
import { ToolType } from "../dto/tool-type.enum";
import { ParameterUtil } from "./parameter.util";
import { WorkflowItemTypes } from "../dto/workflow-types.dto";


export const createParameterDtos = (selfBranchId: number, tools: ToolBranchDto[], selectedToolInputParameters: ParameterDto[] | null) => {
    return tools.map((tool, i) => {
        const fileName = tool.fileName;
        const branchName = tool.branchName;
        const isAnonymous = tool.branchId < 0;
        const isRouter = tool.config.type === ToolType.PROMPT && (tool.config as PromptConfigDto).promptSelectTool;

        const className = ParameterUtil.toCamelCase(isAnonymous ? tool.branchName : fileName, true);
        const isStructured = isRouter || (tool.branchId === selfBranchId ? tool.inputIsStructured : tool.outputIsStructured);
        const parameters = isStructured ? (tool.branchId === selfBranchId ? tool.inputParameters : tool.outputParameters) : null;

        return {
            uuid: tool.branchId === selfBranchId ? className + '.input' : className + '.output',
            name: tool.branchId === selfBranchId ? 'input' : className,
            description: `${tool.branchId === selfBranchId ? 'Input' : 'Output'} parameter for ${fileName} (${branchName}).`,
            type: isStructured ? ParameterType.OBJECT : ParameterType.STRING,
            isRequired: true,
            isArray: false,
            ragType: ParameterRagType.NONE,
            subProperties: !isRouter ? (parameters ?? undefined) : (i < tools.length - 1 ? tools[i + 1].inputParameters : (selectedToolInputParameters ?? [])),
        } satisfies ParameterDto;
    })
};

const _getMappableDotPaths = (fromParameter: ParameterDto, toParameter: Omit<ParameterDto, 'subProperties'>, dotPath: string[], parentDotPath: string[] | null, forWorkflowItemType: WorkflowItemTypes | undefined, includeArrays: boolean = true): string[] => {
    const currentPath = [...dotPath, fromParameter.name];
    const fullName = currentPath.join('.');

    let additionalValidTypes: ParameterType[] = [];
    if (forWorkflowItemType === WorkflowItemTypes.CONDITIONAL) {
        if (toParameter.type === ParameterType.BOOLEAN) {
            additionalValidTypes = [ParameterType.ENUM];
        } else if (toParameter.type === ParameterType.ENUM) {
            additionalValidTypes = [ParameterType.BOOLEAN];
        } else {
            toParameter.type = ParameterType.BOOLEAN;
            additionalValidTypes = [ParameterType.ENUM];
        }
    }

    let isValidMap = false;
    if (forWorkflowItemType === WorkflowItemTypes.LOOP && fromParameter.isArray && includeArrays) {
        isValidMap = true;
    } else if (toParameter.isArray && fromParameter.isArray) {
        if (includeArrays) {
            if (toParameter.type === fromParameter.type || additionalValidTypes.includes(fromParameter.type)) {
                isValidMap = true;
            } else if (toParameter.type === ParameterType.STRING && fromParameter.type !== ParameterType.OBJECT) {
                isValidMap = true;
            }
        }
    } else if ((!toParameter.isArray || !includeArrays) && !fromParameter.isArray && toParameter.type !== ParameterType.OBJECT && fromParameter.type !== ParameterType.OBJECT) {
        if (toParameter.type === fromParameter.type || additionalValidTypes.includes(fromParameter.type)) {
            isValidMap = true;
        } else if (toParameter.type === ParameterType.STRING) {
            isValidMap = true;
        }
    }

    if (toParameter.type === ParameterType.STRING && includeArrays) {
        isValidMap = true;
    }

    if (forWorkflowItemType === WorkflowItemTypes.CONDITIONAL && includeArrays && !fromParameter.isRequired) {
        isValidMap = true;
    }

    const flattenArraySubProperties = toParameter.isArray && fromParameter.isArray && fromParameter.type === ParameterType.OBJECT && toParameter.type !== ParameterType.OBJECT;
    const isParentSelectedArray = fromParameter.isArray && fromParameter.name === parentDotPath?.[0];

    // if (props.parameter.name === 'stringArray' && props.mappableParameters.parentSelectedDotPath?.join('.') === 'Step1.object.objectArray') {
    //     console.log(fullName, isValidMap, parameter.type !== ParameterType.ENUM && ((includeArrays && (isParentSelectedArray || flattenArraySubProperties)) || !parameter.isArray), isParentSelectedArray, flattenArraySubProperties, includeArrays, parentDotPath?.map(p => p));
    // }

    const subParams = fromParameter.type !== ParameterType.ENUM && ((includeArrays && (isParentSelectedArray || flattenArraySubProperties)) || !fromParameter.isArray) ? fromParameter.subProperties?.flatMap(p => _getMappableDotPaths(p, toParameter, currentPath, parentDotPath?.slice(1) ?? null, forWorkflowItemType, flattenArraySubProperties && !(isParentSelectedArray || !fromParameter.isArray) ? false : includeArrays)) : undefined;

    if (subParams) {
        return isValidMap ? [fullName, ...subParams] : subParams;
    } else {
        return isValidMap ? [fullName] : [];
    }
};

export const getMappableDotPaths = (fromParameters: ParameterDto[], toParameter: Omit<ParameterDto, 'subProperties'>, parentSelectedDotPath: string[] | null, forWorkflowItemType?: WorkflowItemTypes): string[] => {
    return fromParameters.flatMap(fromParameter => _getMappableDotPaths(fromParameter, toParameter, [], parentSelectedDotPath, forWorkflowItemType));//TODO fix: works well for most cases, though, requires more testing, especially for nested arrays. likely need to pass in full list of toParameters, the selected toParameter's indexPath, and the full inputMap in order to correctly establish which array slices are valid for a given indexPath
};

export const getParameterForDotPath = (parameters: ParameterDto[], dotPath: string[]): ParameterDto | undefined => {
    const parameter = parameters.find(p => p.name === dotPath[0]);
    if (!parameter) return undefined;
    if (dotPath.length === 1) return parameter;
    return getParameterForDotPath(parameter.subProperties ?? [], dotPath.slice(1));
};

export const getDotPathForParameter = (targetParam: ParameterDto, parameters: ParameterDto[]): string[] => {
    for (const param of parameters) {
        if (param.uuid === targetParam.uuid) return [param.name];
        if (param.subProperties) {
            const subPath = getDotPathForParameter(targetParam, param.subProperties);
            if (subPath.length) return [param.name, ...subPath];
        }
    }
    return [];
};
