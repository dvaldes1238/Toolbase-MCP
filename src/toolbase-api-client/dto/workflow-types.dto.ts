import { ReactFlowJsonObject } from "@xyflow/react";
import { AllEdgeTypes } from "../dto/edge-types.dto";
import { AllNodeTypes } from "../dto/node-types.dto";

export enum WorkflowItemTypes {
    CONDITIONAL = 'CONDITIONAL',
    LOOP = 'LOOP',
    TOOL = 'TOOL',
    START = 'START',
    END = 'END',
    ERROR = 'ERROR',
    ROUTER = 'ROUTER',
}

export enum InputMapType {
    DOTPATH = 'DOTPATH',
    TEMPLATE = 'TEMPLATE',
    CODE = 'CODE',
}

export type Workflow = ReactFlowJsonObject<AllNodeTypes, AllEdgeTypes>;
export type WorkflowData = Omit<ReactFlowJsonObject<AllNodeTypes, AllEdgeTypes>, 'viewport'>;
export type WorkflowViewport = ReactFlowJsonObject<AllNodeTypes, AllEdgeTypes>['viewport'];