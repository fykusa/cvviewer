import { Node, Edge } from 'reactflow';

export interface GroupData {
  id: string;
  label: string;
  comment?: string;
  borderColor?: string;
  bgColor?: string;
  titleColor?: string;
  commentColor?: string;
}

export interface ViewerGroup {
  id: string;
  title: string;
  comment?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  memberIds: string[];
  borderColor?: string;
  bgColor?: string;
  titleColor?: string;
  commentColor?: string;
}

export type CalculationViewType =
  | 'ProjectionView'
  | 'JoinView'
  | 'AggregationView'
  | 'UnionView'
  | 'RankView'
  | 'StarJoinView'
  | 'DATA_BASE_TABLE'
  | 'Semantics';

export interface ViewAttribute {
  id: string;
  datatype?: string;
  length?: string;
  isCalculated?: boolean;
  formula?: string;
}

export interface InputConnection {
  nodeId: string;
  mapping?: Array<{ target: string; source: string }>;
}

export interface CalculationViewData {
  id: string;
  type: CalculationViewType;
  viewAttributes?: ViewAttribute[];
  inputs?: InputConnection[];
  joinType?: 'inner' | 'leftOuter' | 'rightOuter' | 'fullOuter' | 'text';
  filters?: any[];
  calculatedViewAttributes?: any[];
  comment?: string;
  filter?: string;
}

export interface LayoutShape {
  modelObjectName: string;
  x: number;
  y: number;
  expanded?: boolean;
  rectWidth?: string | number;
  rectHeight?: string | number;
}

export interface ParsedCalculationView {
  id: string;
  dataSources: Array<{
    id: string;
    type: string;
    schemaName?: string;
    columnObjectName?: string;
  }>;
  calculationViews: CalculationViewData[];
  layoutShapes: LayoutShape[];
  outputs?: any[];
  logicalModel?: any;
  globalComment?: string;
  viewerGroups?: ViewerGroup[];
}

export type NodeData = Node & {
  data: {
    id: string;
    type: CalculationViewType;
    label: string;
    attributes?: ViewAttribute[];
    joinType?: string;
    inputs?: InputConnection[];
    isDataSource?: boolean;
    dataSourceInfo?: {
      schemaName?: string;
      columnObjectName?: string;
    };
    comment?: string;
    filter?: string;
    onCommentClick?: () => void;
  };
};

export type FlowEdgeData = Edge & {
  data?: {
    sourceLabel?: string;
    targetLabel?: string;
    mappings?: Array<{ target: string; source: string }>;
  };
};
