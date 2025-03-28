
import { ToolBranchDto } from "../dto/tool.dto";
import { ParameterDto, ParameterType } from "../dto/parameter.dto";
import { ToolCallDto } from "../dto/prompt-config.dto";
import { v4 } from "uuid";
import { ParameterUtil } from "./parameter.util";
import { createParameterDtos, getParameterForDotPath } from "./parameter-mapper.util";
import { AllNodeTypes, ConditionalNodeDataType, ConditionalNodeType, LoopNodeType, RouterNodeDataType, RouterNodeType, StartNodeType, ToolNodeType } from "../dto/node-types.dto";
import { InputMapType, WorkflowData, WorkflowItemTypes } from "../dto/workflow-types.dto";

export class Dag {
    private parentMap: Map<string, string[]>;
    private nodeMap: Map<string, AllNodeTypes>;

    constructor(public readonly data: WorkflowData) {
        this.parentMap = new Map();
        this.nodeMap = new Map(data.nodes.map(node => [node.id, node]));

        if (this.nodeMap.get(WorkflowItemTypes.START)?.type !== WorkflowItemTypes.START) {
            throw new Error('Start node not found');
        }

        for (const { source, target } of data.edges) {
            this.parentMap.set(target, [...(this.parentMap.get(target) ?? []), source]);
        }
    }

    private _getAncestors(nodeId: string, ignoreClosedBlocks: boolean = false): Set<string> {
        const ancestors = new Set<string>();

        const dfs = (node: string) => {
            const parents = this.parentMap.get(node) || [];

            if (ignoreClosedBlocks && parents.length > 1) {
                const commonAncestor = this._findCommonAncestor(parents);

                if (commonAncestor) {
                    if (!ancestors.has(commonAncestor)) {
                        dfs(commonAncestor);
                    }
                    return;
                }
            }

            parents.forEach(parent => {
                if (!ancestors.has(parent)) {
                    ancestors.add(parent);
                    dfs(parent);
                }
            });
        };

        dfs(nodeId);
        return ancestors;
    }

    public getUpstreamNodes(nodeId: string, skipBlocks: boolean = true, filter?: Omit<WorkflowItemTypes, WorkflowItemTypes.START>[]): AllNodeTypes[] {
        if (nodeId === WorkflowItemTypes.START || (filter && filter.length === 0)) {
            return [this.nodeMap.get(WorkflowItemTypes.START)!];
        }

        const ancestors = new Set<string>();
        let ordered: AllNodeTypes[] = [];

        const dfs = (node: string) => {
            const parents = this.parentMap.get(node) || [];

            if (skipBlocks && parents.length > 1) {
                const commonAncestor = this._findCommonAncestor(parents);

                if (commonAncestor && !ancestors.has(commonAncestor)) {
                    ancestors.add(commonAncestor);

                    const node = this.nodeMap.get(commonAncestor)!;
                    if (!filter || (node.type && filter.includes(node.type))) {
                        ordered = [node, ...ordered];
                    }

                    dfs(commonAncestor);
                }

                return;
            }

            parents.forEach(parent => {
                if (!ancestors.has(parent)) {
                    ancestors.add(parent);

                    const node = this.nodeMap.get(parent)!;
                    if (!filter || (node.type && filter.includes(node.type))) {
                        ordered = [node, ...ordered];
                    }

                    dfs(parent);
                }
            });
        };

        dfs(nodeId);
        return ordered[0]?.type !== WorkflowItemTypes.START ? [this.nodeMap.get(WorkflowItemTypes.START)!, ...ordered] : ordered;
    }

    private _findCommonAncestor(nodeIds: string[]): string | null {
        if (nodeIds.length < 2) throw new Error('At least two nodes are required to find a common ancestor');
        if (nodeIds.length === 1) return nodeIds[0];

        // Get ancestors for all nodes
        const ancestorSets = nodeIds.map(id => this._getAncestors(id));

        // Get common ancestors
        const commonAncestors = new Set<string>();
        ancestorSets.forEach(set => {
            set.forEach(ancestor => {
                if (ancestorSets.every(set => set.has(ancestor))) {
                    commonAncestors.add(ancestor);
                }
            });
        });

        if (commonAncestors.size === 0) return null;

        // Find the lowest common ancestors
        const lowestCommonAncestors = new Set(commonAncestors);

        for (const ancestor of commonAncestors) {
            const ancestorsOfCurrent = this._getAncestors(ancestor);
            ancestorsOfCurrent.forEach(higherAncestor => {
                lowestCommonAncestors.delete(higherAncestor);
            });
        }

        // If there are multiple lowest common ancestors, return null
        // This indicates that there isn't a single unique lowest common ancestor
        if (lowestCommonAncestors.size > 1) return null;

        return lowestCommonAncestors.size === 1 ? Array.from(lowestCommonAncestors)[0] : null;
    }

    public getLowestCommonAncestor(nodeIds: string[]): AllNodeTypes | null {
        const commonAncestor = this._findCommonAncestor(nodeIds);

        if (!commonAncestor) {
            return null;
        }

        return this.nodeMap.get(commonAncestor)!;
    }


}

const getUpstreamNodes = (targetNodeId: string, data: WorkflowData, filter?: Omit<WorkflowItemTypes, WorkflowItemTypes.START>[]): (AllNodeTypes)[] => {//TODO refactor util file to be inside dag class
    const dag = new Dag(data);
    return dag.getUpstreamNodes(targetNodeId, true, filter);
};

export const WorkflowUtil = {
    getUpstreamNodes,
};

export const parseWorkflowData = (stringifiedWorkflowData: string, selectedItems: WorkflowData, branchId: number) => {
    try {
        if (stringifiedWorkflowData !== '' && stringifiedWorkflowData.startsWith('{') && stringifiedWorkflowData.endsWith('}')) {
            const parsedData = JSON.parse(stringifiedWorkflowData) as WorkflowData;

            parsedData.nodes.forEach(node => {
                if (selectedItems.nodes.find(n => n.id === node.id)) {
                    node.selected = true;
                }
            });

            parsedData.edges.forEach(edge => {
                if (selectedItems.edges.find(e => e.id === edge.id)) {
                    edge.selected = true;
                }
            });

            return {
                data: parsedData,
                isDefault: false,
            };
        }
    } catch (error) { }

    return {
        data: {
            nodes: [{
                id: WorkflowItemTypes.START,
                type: WorkflowItemTypes.START,
                data: {
                    type: WorkflowItemTypes.START,
                    branchId: branchId,
                },
                position: { x: 0, y: 0 },
            } satisfies AllNodeTypes,
            {
                id: WorkflowItemTypes.END + '-' + v4(),
                type: WorkflowItemTypes.END,
                position: { x: 0, y: 100 },
                data: {
                    type: WorkflowItemTypes.END,
                    branchId: branchId,
                    inputMap: {},
                },
            } satisfies AllNodeTypes],
            edges: [],
        } satisfies WorkflowData,
        isDefault: true,
    }
};

export const getHandleIdsForConditionalNode = (targetNode: ConditionalNodeDataType, targetParameter: ParameterDto) => {
    if (targetNode.condition.left) {
        if (targetNode.condition.type === InputMapType.DOTPATH) {
            if (targetParameter.type === ParameterType.BOOLEAN) {
                return targetParameter.isRequired ? ['if-true', 'if-false'] : ['if-true', 'if-false', 'if-undefined'];
            } else if (targetParameter.type === ParameterType.ENUM) {
                return targetParameter.isRequired ? (targetParameter.subProperties?.map(p => `if-${p.name}`) ?? []) : (targetParameter.subProperties?.map(p => `if-${p.name}`) ?? []).concat('if-undefined');
            }
        }
    }

    return targetParameter.isRequired ? [] : ['if-defined', 'if-undefined'];
}

const validateConditionalNode = (node: ConditionalNodeType, data: WorkflowData, toolBranches: { [branchIdDotNodeId: string]: ToolBranchDto | undefined }) => {
    const upstreamNodes = getUpstreamNodes(node.id, data, [WorkflowItemTypes.TOOL, WorkflowItemTypes.ROUTER]) as (ToolNodeType | StartNodeType | RouterNodeType)[];
    const upstreamToolBranches = upstreamNodes.map(n => {
        const branchId = n.data.type === WorkflowItemTypes.ROUTER ? n.data.toolBranch.branchId : n.data.branchId;
        const toolBranch = toolBranches[branchId + '.' + n.id];

        return toolBranch;
    }).filter(t => t !== undefined);

    const upstreamParameters = createParameterDtos((upstreamNodes[0] as StartNodeType).data.branchId, upstreamToolBranches, null);

    const targetParameter = node.data.condition.type === InputMapType.DOTPATH ? getParameterForDotPath(upstreamParameters, node.data.condition.left?.split('.') ?? []) : undefined;
    const handleIds = targetParameter ? getHandleIdsForConditionalNode(node.data, targetParameter) : ['if-Yes', 'if-No'];

    const conditionalConnections = data.edges.filter(e => e.source === node.id);

    const uniqueHandleIds = Array.from(new Set([...node.data.handles.map(h => h.id), ...handleIds]));

    const handles = uniqueHandleIds.map(handleId => {
        const name = handleId.substring(handleId.indexOf('-') + 1);
        const isValid = handleIds.includes(handleId);
        const hasConnections = conditionalConnections.find(c => c.sourceHandle === handleId) !== undefined;

        let error: string | null = null;

        if (!isValid) {
            error = `'${name}' is no longer a valid option`;
        }

        const handle = !isValid && !hasConnections ? null : {
            id: handleId,
            name,
            error
        } satisfies ConditionalNodeDataType['handles'][number];

        return handle;
    }).filter(h => h !== null);

    return { ...node, data: { ...node.data, handles } } as ConditionalNodeType;
}

const validateLoopNode = (node: LoopNodeType, data: WorkflowData, toolBranches: { [branchIdDotNodeId: string]: ToolBranchDto | undefined }) => {


    return node;
}

const validateToolNode = (node: ToolNodeType, data: WorkflowData, toolBranches: { [branchIdDotNodeId: string]: ToolBranchDto | undefined }) => {
    return node;

}

const validateRouterNode = (node: RouterNodeType, data: WorkflowData, toolBranches: { [branchIdDotNodeId: string]: ToolBranchDto | undefined }) => {
    const activeEdges = data.edges.filter(e => e.source === node.id);

    const startNode = data.nodes.find(n => n.type === WorkflowItemTypes.START) as StartNodeType | undefined;
    const workflowToolBranch = startNode ? toolBranches[startNode.data.branchId + '.' + startNode.id] : undefined;

    if (!startNode || !workflowToolBranch) {
        throw new Error('Start node or workflow tool branch not found');
    }

    const availableToolToNodeIdMap = new Map<Object, string>();
    const availableTools = activeEdges.map(e => {
        const targetNode = data.nodes.find(n => n.id === e.target);
        if (!targetNode) {
            return undefined;
        }

        switch (targetNode.data.type) {
            case WorkflowItemTypes.TOOL:
                const tool = toolBranches[targetNode.data.branchId + '.' + targetNode.id];
                if (tool) {
                    availableToolToNodeIdMap.set(tool, targetNode.id);
                }
                return tool;
            case WorkflowItemTypes.ROUTER:
                const routerTool = toolBranches[targetNode.data.toolBranch.branchId + '.' + targetNode.id];
                if (routerTool) {
                    availableToolToNodeIdMap.set(routerTool, targetNode.id);
                }
                return routerTool;
            case WorkflowItemTypes.END:
                return null;
            default:
                return undefined;
        }
    }).filter(t => t !== undefined);

    const newHandleId = node.data.handles.find(h => !Boolean(activeEdges.find(e => e.sourceHandle === h.id)))?.id ?? v4();
    const handleIds = activeEdges.map(e => e.sourceHandle!).concat(newHandleId);

    const toolNames: string[] = [];
    const handles = handleIds.map(handleId => {
        let name = '';
        if (handleId === newHandleId) {
            name = 'New Connection';
        } else {
            // Find the edge and corresponding target tool for this handle
            const edge = activeEdges.find(e => e.sourceHandle === handleId);
            const targetNode = edge ? data.nodes.find(n => n.id === edge.target) : null;
            if (targetNode) {
                switch (targetNode.data.type) {
                    case WorkflowItemTypes.TOOL:
                        const tool = toolBranches[targetNode.data.branchId + '.' + targetNode.id];
                        name = tool ? ParameterUtil.toCamelCase(tool.fileName) : '';
                        break;
                    case WorkflowItemTypes.ROUTER:
                        const routerTool = toolBranches[targetNode.data.toolBranch.branchId + '.' + targetNode.id];
                        name = routerTool ? ParameterUtil.toCamelCase(routerTool.fileName) : '';
                        break;
                }
            }
        }

        let i = 1;
        let baseName = name;
        let error: string | null = null;
        while (toolNames.includes(name)) {
            name = baseName + i++;
            error = `Duplicate tool name: '${baseName}'. Renamed to '${name}'.`;
        }


        const handle = {
            id: handleId,
            name,
            error
        } satisfies RouterNodeDataType['handles'][number];

        toolNames.push(name);

        return handle;
    }).filter(h => h !== null);

    toolNames.length = 0;

    const newData = {
        ...node,
        data: {
            ...node.data,
            handles,
            toolBranch: {
                ...node.data.toolBranch,
                config: {
                    ...node.data.toolBranch.config,
                    tools: availableTools.map(t => {
                        let toolName = ParameterUtil.toCamelCase((t ? t.fileName : workflowToolBranch.fileName));

                        let i = 1;
                        while (toolNames.includes(toolName)) {
                            toolName = ParameterUtil.toCamelCase((t ?? workflowToolBranch).fileName) + i++;
                        }

                        toolNames.push(toolName);

                        const toolBranchId = t ? t.branchId : workflowToolBranch.branchId;

                        return {
                            toolBranchId,
                            toolName,
                            toolSummary: (t ?? workflowToolBranch).summary || 'No summary specified - use available parameters to generate a response.',
                            isInput: Boolean(t),
                            nodeId: toolBranchId < 0 && t ? availableToolToNodeIdMap.get(t) : undefined
                        } satisfies ToolCallDto
                    })
                }
            } satisfies ToolBranchDto
        }
    } as RouterNodeType;

    return newData;
}

const validateParameterMapping = () => {
    //TODO implement
}

export const validateNode = (node: AllNodeTypes, data: WorkflowData, toolBranches: { [branchIdDotNodeId: string]: ToolBranchDto | undefined }) => {
    const allUpstreamNodes = getUpstreamNodes(node.id, data);
    const precededByRouter = allUpstreamNodes[allUpstreamNodes.length - 1].type === WorkflowItemTypes.ROUTER;

    if (!precededByRouter) {
        validateParameterMapping();
    }

    switch (node.type) {
        case WorkflowItemTypes.CONDITIONAL:
            return validateConditionalNode(node as ConditionalNodeType, data, toolBranches);
        case WorkflowItemTypes.LOOP:
            return validateLoopNode(node as LoopNodeType, data, toolBranches);
        case WorkflowItemTypes.TOOL:
            return validateToolNode(node as ToolNodeType, data, toolBranches);
        case WorkflowItemTypes.ROUTER:
            return validateRouterNode(node as RouterNodeType, data, toolBranches);
        default:
            return node;
    }
}

export const getValidatedWorkflowData = (data: WorkflowData, toolBranches: { [branchIdDotNodeId: string]: ToolBranchDto | undefined }) => {
    const nodes = data.nodes.map(node => {
        return validateNode(node, data, toolBranches);
    });

    return { ...data, nodes } satisfies WorkflowData;
}


export const getNodeChildren = (targetNodeId: string, data: WorkflowData) => {
    const edges = data.edges.filter(e => e.source === targetNodeId);
    const children = edges.map(e => data.nodes.find(n => n.id === e.target));
    return children.filter(c => c !== undefined);
}
