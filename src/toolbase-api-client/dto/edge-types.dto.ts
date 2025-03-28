import { Edge, EdgeProps } from "@xyflow/react";
import { WorkflowItemTypes } from "../dto/workflow-types.dto";


export type AllEdgeDataTypes = Readonly<{
    scopeStacks: { [type in keyof AllEdgeDataTypes]: string[] }//values are node ids
}>;

export type AllEdgePropsType = EdgeProps<AllEdgeTypes>;

export type AllEdgeTypes = Edge<
    AllEdgeDataTypes,
    WorkflowItemTypes
>;