import { Node, NodeProps } from "@xyflow/react";
import { ToolBranchDto } from "../dto/tool.dto";
import { EqualityOperator, NumericOperator } from "../dto/operators.enum";
import { InputMapType, WorkflowItemTypes } from "../dto/workflow-types.dto";


export class InputMapValue {
    
    
    type: InputMapType;

    
    
    error: string | null;

    
    
    value: string | null;
}

export type InputMap = {
    [dotPath: string]: InputMapValue;
}

export type ToolNodeDataType = {
    type: WorkflowItemTypes.TOOL,
    branchId: number,
    // name: string,
    anonymousToolBranch?: ToolBranchDto,
    inputMap: InputMap
};

export type ConditionalNodeDataType = Readonly<{
    type: WorkflowItemTypes.CONDITIONAL,
    // name: string | null,
    handles: {
        id: string,
        name: string,
        error: string | null,
    }[],
    condition: {
        type: InputMapType.DOTPATH,
        left: string | null,
        operator?: NumericOperator | EqualityOperator | null,
        right?: string | null,
        error: string | null,
    }
}>;

export type LoopNodeDataType = Readonly<{
    type: WorkflowItemTypes.LOOP,
    // name: string | null,
    loop: {
        type: InputMapType,
        value: string | null,
        error: string | null,
    }
}>;

export type StartNodeDataType = Readonly<{
    type: WorkflowItemTypes.START,
    branchId: number,
}>;

export type EndNodeDataType = Readonly<{
    type: WorkflowItemTypes.END,
    branchId: number,
    inputMap: InputMap
}>;

export type ErrorNodeDataType = Readonly<{
    type: WorkflowItemTypes.ERROR,
    originalData: ToolNodeDataType | ConditionalNodeDataType | LoopNodeDataType | EndNodeDataType | RouterNodeDataType,
    error: Error,
}>;

export type RouterNodeDataType = Readonly<{
    type: WorkflowItemTypes.ROUTER,
    toolBranch: ToolBranchDto,
    handles: {
        id: string,
        name: string,
        error: string | null,
    }[],
    inputMap: InputMap
}>;

export type ToolNodeType = Node<
    ToolNodeDataType,
    WorkflowItemTypes.TOOL
>;
export type ToolNodePropsType = NodeProps<ToolNodeType>;

export type ConditionalNodeType = Node<
    ConditionalNodeDataType,
    WorkflowItemTypes.CONDITIONAL
>;
export type ConditionalNodePropsType = NodeProps<ConditionalNodeType>;

export type LoopNodeType = Node<
    LoopNodeDataType,
    WorkflowItemTypes.LOOP
>;
export type LoopNodePropsType = NodeProps<LoopNodeType>;

export type StartNodeType = Node<
    StartNodeDataType,
    WorkflowItemTypes.START
>;
export type StartNodePropsType = NodeProps<StartNodeType>;

export type AllNodePropsType = ToolNodePropsType | ConditionalNodePropsType | LoopNodePropsType | StartNodePropsType | EndNodePropsType | ErrorNodePropsType | RouterNodePropsType;

export type EndNodeType = Node<
    EndNodeDataType,
    WorkflowItemTypes.END
>;
export type EndNodePropsType = NodeProps<EndNodeType>;

export type ErrorNodeType = Node<
    ErrorNodeDataType,
    WorkflowItemTypes.ERROR
>;
export type ErrorNodePropsType = NodeProps<ErrorNodeType>;

export type RouterNodeType = Node<
    RouterNodeDataType,
    WorkflowItemTypes.ROUTER
>;
export type RouterNodePropsType = NodeProps<RouterNodeType>;

export type AllNodeDataTypes = ToolNodeDataType | ConditionalNodeDataType | LoopNodeDataType | StartNodeDataType | EndNodeDataType | ErrorNodeDataType | RouterNodeDataType;
export type AllNodeTypes = Node<
    AllNodeDataTypes,
    WorkflowItemTypes
>;