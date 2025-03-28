import Ajv from "ajv";
import addFormats from "ajv-formats";
import { JSONSchema7 } from "json-schema";
import { ParameterDto, ParameterRagType, ParameterType } from "../dto/parameter.dto";
import { v4 } from "uuid";

const parametersToJSONSchema = (schema: JSONSchema7, parameters: ParameterDto[], optionStrict: boolean = false) => {
    parameters.forEach((param: ParameterDto) => {
        schema.required = schema.required ?? [];
        if (param.isRequired || optionStrict) {
            schema.required.push(param.name);
        }

        schema.properties = schema.properties ?? {};
        schema.properties[param.name] = {
            type: param.type === ParameterType.ENUM ? undefined : param.type === ParameterType.DATE ? (param.isRequired ? 'string' : optionStrict ? ['string', 'null'] : 'string') : param.isRequired ? param.type : optionStrict ? [param.type, 'null'] : param.type,
            description: param.description
        };

        if (param.isArray) {
            (schema.properties[param.name] as JSONSchema7).type = param.isRequired ? 'array' : optionStrict ? ['array', 'null'] : 'array';
            (schema.properties[param.name] as JSONSchema7).items = {
                type: param.type === ParameterType.ENUM ? undefined : param.type === ParameterType.DATE ? (param.isRequired ? 'string' : optionStrict ? ['string', 'null'] : 'string') : param.isRequired ? param.type : optionStrict ? [param.type, 'null'] : param.type,
            };

            if (param.type === ParameterType.DATE) {
                ((schema.properties[param.name] as JSONSchema7).items as JSONSchema7).format = 'date-time';
            } else if (param.type === ParameterType.OBJECT && param.subProperties && param.subProperties.length > 0) {
                (schema.properties[param.name] as JSONSchema7).items = parametersToJSONSchema((schema.properties[param.name] as JSONSchema7).items as JSONSchema7, param.subProperties, optionStrict);
            } else if (param.type === ParameterType.ENUM && param.subProperties && param.subProperties.length > 0) {
                (schema.properties[param.name] as JSONSchema7).items = { oneOf: param.subProperties.map((subParam) => ({ const: subParam.name, description: subParam.description })) };
                if (!param.isArray && !param.isRequired && optionStrict) {
                    ((schema.properties[param.name] as JSONSchema7).items as JSONSchema7).oneOf?.push({ const: null, description: 'No value' });
                }
            }
        } else if (param.type === ParameterType.DATE) {
            (schema.properties[param.name] as JSONSchema7).format = 'date-time';
        } else if (param.type === ParameterType.OBJECT && param.subProperties && param.subProperties.length > 0) {
            schema.properties[param.name] = parametersToJSONSchema(schema.properties[param.name] as JSONSchema7, param.subProperties, optionStrict);
        } else if (param.type === ParameterType.ENUM && param.subProperties && param.subProperties.length > 0) {
            (schema.properties[param.name] as JSONSchema7).oneOf = param.subProperties?.map((subParam) => ({ const: subParam.name, description: subParam.description }));
            if (!param.isArray && !param.isRequired && optionStrict) {
                ((schema.properties[param.name] as JSONSchema7).oneOf as JSONSchema7[]).push({ const: null, description: 'No value' });
            }
        }
    });

    if (schema.required?.length === 0) {
        delete schema.required;
    }

    return schema;
};

const parametersFromJSONSchema = (schema: JSONSchema7): ParameterDto[] => {
    if (schema.type === ParameterType.OBJECT || (schema.type === 'array' && schema.items && (schema.items as JSONSchema7).type === ParameterType.OBJECT)) {
        return Object.entries(schema.properties ?? (schema.items as JSONSchema7)?.properties ?? {}).map(([name, property]) => {
            let type = (property as JSONSchema7).type === 'array' ? ((property as JSONSchema7).items as JSONSchema7)?.type as ParameterType : (property as JSONSchema7).type as ParameterType;
            if (type === 'string' && (property as JSONSchema7).format === 'date-time') {
                type = ParameterType.DATE;
            }

            let subProperties: ParameterDto[] | undefined;
            if ((property as JSONSchema7).type === 'object' || ((property as JSONSchema7).type === 'array' && ((property as JSONSchema7).items as JSONSchema7)?.type === 'object')) {
                subProperties = parametersFromJSONSchema(property as JSONSchema7);
            } else if (!type && ((property as JSONSchema7).oneOf || ((property as JSONSchema7).items as JSONSchema7)?.oneOf)) {
                type = ParameterType.ENUM;
                subProperties = ((property as JSONSchema7).oneOf ?? ((property as JSONSchema7).items as JSONSchema7)?.oneOf!).map((option) => ({
                    uuid: v4(),
                    name: (option as JSONSchema7).const as string,
                    description: (option as JSONSchema7).description ?? '',
                    type: ParameterType.STRING,
                    isRequired: false,
                    isArray: false,
                    ragType: ParameterRagType.NONE,
                }));
            }

            if (!Object.values(ParameterType).includes(type)) {
                throw new Error(`Invalid parameter type for ${name}: '${type}' must be one of ${Object.values(ParameterType).join(', ')}`);
            }

            return {
                uuid: v4(),
                name,
                description: (property as JSONSchema7).description ?? '',
                type,
                isRequired: schema.type === 'array' ? ((schema.items as JSONSchema7).required?.includes(name) ?? false) : (schema.required?.includes(name) ?? false),
                isArray: (property as JSONSchema7).type === 'array',
                ragType: ParameterRagType.NONE,
                subProperties
            } satisfies ParameterDto;
        });
    } else {
        throw new Error('Invalid schema');
    }
}

const trimParam = (param: ParameterDto) => {
    param.name = ParameterUtil.toCamelCase(param.name);
    param.description = param.description.trim();
    if (param.subProperties) {
        param.subProperties.forEach(trimParam);
    }
};

const generateAccessor = (options: { parameters: ParameterDto[], indexPath: number[], type: 'code' | 'template' | 'assert' }, fanOutEnum: boolean = true) => {
    const { parameters, indexPath, type } = options;
    const copyAsCode = type === 'code' || type === 'assert';
    const copyAsAssert = type === 'assert';
    const copyAsTemplate = type === 'template';

    // console.log('onInsertDotPath', indexPath);
    const getParam = (parameter: ParameterDto, indexPath: number[], dotPath: string, tabCount = 0): string => {
        if (indexPath.length === 0) {
            const indent = '\t'.repeat(tabCount);
            if (copyAsCode) {
                if (copyAsAssert) {
                    return `${indent}assert(${dotPath}, "Add failure message here. In this case, it occurs if '${dotPath}' is not present.");`;
                } else {
                    return `${indent}${dotPath};`;
                }
            } else if (copyAsTemplate) {
                return `${indent}{{${dotPath}}}`;
            } else {
                throw new Error('Invalid parameter view state');
            }
        }

        const index = indexPath[0];
        const subParam = parameter.subProperties?.[index];
        if (!subParam) {
            throw new Error('Parameter not found at index path');
        }

        const ifElseWrapper = (condition: string, bodyTrue: string, tabCount: number, bodyElse: string | null | undefined = undefined, ...elseIfConditionBodyPairs: ([string, string])[]) => {
            const indent = '\t'.repeat(tabCount);
            if (copyAsCode) {
                const elseIfs = elseIfConditionBodyPairs.map(([condition, body]) => ` else if (${condition}) {\n${body}\n${indent}}`).join('');
                const elseBody = bodyElse === undefined ? '' : ` else {\n${indent}\t${(bodyElse !== null ? bodyElse : `// Add logic here for when all other cases are false`)}\n${indent}}`;
                return `${indent}if (${condition}) {\n${indent}\t${bodyTrue}\n${indent}}${elseIfs}${elseBody}`;
            } else if (copyAsTemplate) {
                const elseIfs = elseIfConditionBodyPairs.map(([condition, body]) => `\n${indent}{{else if ${condition}}}\n${indent}\t${body}`).join('');
                const elseBody = bodyElse === undefined ? '' : `\n${indent}{{else}}\n${indent}\t${(bodyElse !== null ? bodyElse : `{{! Add logic here to handle the case where the condition is false }}`)}`;
                return `${indent}{{#if ${condition}}}\n${indent}\t${bodyTrue}${elseIfs}${elseBody}\n${indent}{{/if}}`;
            } else {
                throw new Error('Invalid parameter view state');
            }
        };

        const eachWrapper = (singularizedName: string, body: string, tabCount: number) => {
            const indent = '\t'.repeat(tabCount);
            if (copyAsCode) {
                return `${indent}for (const ${singularizedName} of ${dotPath}.${subParam.name}) {\n${body}\n${indent}}`;
            } else if (copyAsTemplate) {
                return `${indent}{{#each ${dotPath}.${subParam.name} as |${singularizedName}|}}\n${body}\n${indent}{{/each}}`;
            } else {
                throw new Error('Invalid parameter view state');
            }
        };

        const wrap = (toWrap: typeof wrapStrategy, tabCount: number, singularizedName?: string): string => {
            const next = toWrap[0];
            if (!next) return '';
            const { type: nextType, fanOutEnum } = next.type === 'ifElse' ? next : { type: next.type, fanOutEnum: false };

            const currentDotPath = singularizedName ?? `${dotPath}.${subParam.name}`;

            if (nextType === 'ifElse') {
                return ifElseWrapper(
                    !fanOutEnum || subParam.type !== ParameterType.ENUM ? currentDotPath : `${currentDotPath} ${copyAsCode ? '===' : "'==='"} '${subParam.subProperties![0].name}'`,
                    wrap(toWrap.slice(1), tabCount + 1),
                    tabCount,
                    subParam.type === ParameterType.BOOLEAN || (fanOutEnum && subParam.type === ParameterType.ENUM) ? '' : undefined,
                    ...(fanOutEnum && subParam.type === ParameterType.ENUM ? subParam.subProperties?.slice(1).map(subSubParam => [`${currentDotPath} ${copyAsCode ? '===' : "'==='"} '${subSubParam.name}'`, '']) : []) as [string, string][]
                );
            } else if (nextType === 'each') {
                const singularizedName = subParam.name.endsWith('s') ? subParam.name.slice(0, -1) : subParam.name;
                return eachWrapper(
                    singularizedName,
                    wrap(toWrap.slice(1), tabCount + 1, singularizedName),
                    tabCount
                );
            } else if (nextType === 'get') {
                return getParam(subParam, indexPath.slice(1), currentDotPath, tabCount)
            }

            throw new Error('Invalid wrap path');
        }

        const wrapStrategy: ({ type: 'each' | 'get' } | { type: 'ifElse', fanOutEnum: boolean })[] = [];

        if (subParam.isArray) {
            if (subParam.type === ParameterType.BOOLEAN || (subParam.type === ParameterType.ENUM && fanOutEnum)) {
                if (!subParam.isRequired) {
                    wrapStrategy.push({ type: 'ifElse', fanOutEnum: false });
                }
                wrapStrategy.push({ type: 'each' });
                wrapStrategy.push({ type: 'ifElse', fanOutEnum: true });
            } else {
                if (!subParam.isRequired) {
                    wrapStrategy.push({ type: 'ifElse', fanOutEnum: false });
                }
                wrapStrategy.push({ type: 'each' });
                wrapStrategy.push({ type: 'get' });
            }
        } else if (!subParam.isRequired || subParam.type === ParameterType.BOOLEAN || (subParam.type === ParameterType.ENUM && fanOutEnum)) {
            wrapStrategy.push({ type: 'ifElse', fanOutEnum: true });
            if (subParam.type !== ParameterType.BOOLEAN && subParam.type !== ParameterType.ENUM) {
                wrapStrategy.push({ type: 'get' });
            }
        } else {
            wrapStrategy.push({ type: 'get' });
        }

        return wrap(wrapStrategy, tabCount);
    };

    if (indexPath.length > 0) {
        const codeOrTemplate = getParam(parameters[indexPath[0]], indexPath.slice(1), parameters[indexPath[0]].name);
        return codeOrTemplate;
    }
}

const generateDotPath = (parameter: ParameterDto, dotPath: string[], remainingPath: number[]): string[] => {
    const currentPath = [...dotPath, parameter.name];

    if (remainingPath.length === 0) {
        return currentPath;
    }

    if (!parameter.subProperties || parameter.type === ParameterType.ENUM) {
        return currentPath;
    }

    const nextIndex = remainingPath[0];
    if (nextIndex >= parameter.subProperties.length) {
        return currentPath;
    }

    return generateDotPath(
        parameter.subProperties[nextIndex],
        currentPath,
        remainingPath.slice(1)
    );
};

const getUserFriendlyTypeName = (type: ParameterType) => {
    switch (type) {
        case ParameterType.STRING:
            return 'Text';
        case ParameterType.NUMBER:
            return 'Number';
        case ParameterType.BOOLEAN:
            return 'Yes/No';
        case ParameterType.DATE:
            return 'Date';
        case ParameterType.OBJECT:
            return 'Structure';
        case ParameterType.ENUM:
            return 'Category';
        default:
            return (type as ParameterType).charAt(0).toUpperCase() + (type as ParameterType).slice(1).toLowerCase();
    }
};

export const ParameterUtil = {
    parametersToJSONSchema: (parameters: ParameterDto[], strict: boolean = false) => {
        return parametersToJSONSchema({
            type: "object",
        }, parameters, strict)
    },
    trimParam,
    parametersFromJSONSchema,
    generateAccessor,
    generateDotPath,
    getUserFriendlyTypeName,
    validateObject: (parameters: ParameterDto[], obj: any) => {
        const ajv = new Ajv({ strict: true });
        addFormats(ajv);
        const validate = ajv.compile(ParameterUtil.parametersToJSONSchema(parameters)!)
        const isValid = validate(obj);
        const errors = validate.errors;
        return { isValid, errors };
    },
    toCamelCase: (str: string, capitalizeFirst: boolean = false) => {
        // Split on non-alphanumeric characters and spaces
        const result = str.trim()
            .split(/[^a-zA-Z0-9]+/)
            .map((word, index) => {
                // If the word is already in camelCase format or starts with a number, preserve it
                if (/^\d/.test(word) || /^[a-z0-9]+[A-Z][a-zA-Z0-9]*$/.test(word)) {
                    return index === 0 && !capitalizeFirst ? word : word.charAt(0).toUpperCase() + word.slice(1);
                }
                // Otherwise, apply standard camelCase transformation
                return index === 0 && !capitalizeFirst
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
        return result;
    },
    toDashedCase: (str: string) => {
        return str.trim()
            // Split on non-alphanumeric characters and spaces, similar to toCamelCase
            .split(/[^a-zA-Z0-9]+/)
            .map(word => {
                // Handle consecutive uppercase letters by converting them to lowercase
                word = word.replace(/([A-Z]+)/g, (match, group) =>
                    group.length > 1 ? group.toLowerCase() : match
                );
                // Handle camelCase and PascalCase
                word = word.replace(/([a-z0-9])([A-Z])/g, '$1-$2');
                return word.toLowerCase();
            })
            .join('-')
            // Remove any duplicate dashes and trim
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    },
    toSnakeCase: (str: string) => {
        return str.trim()
            // Split on non-alphanumeric characters and spaces, similar to toCamelCase
            .split(/[^a-zA-Z0-9]+/)
            .map(word => {
                // Handle consecutive uppercase letters by converting them to lowercase
                word = word.replace(/([A-Z]+)/g, (match, group) =>
                    group.length > 1 ? group.toLowerCase() : match
                );
                // Handle camelCase and PascalCase
                word = word.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
                return word.toLowerCase();
            })
            .join('_')
            // Remove any duplicate underscores and trim
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
    },
    fromCamelCase: (str: string) => {
        // Handle empty or null strings
        if (!str) return str;

        return str
            // Handle consecutive capitals (preserve acronyms)
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
            // Add space between camelCase parts
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            // Handle numbers
            .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
            // Handle first character
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    },
};
