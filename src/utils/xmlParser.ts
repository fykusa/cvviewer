import { XMLParser } from 'fast-xml-parser';
import { Node, Edge, MarkerType } from 'reactflow';
import {
  CalculationViewData,
  LayoutShape,
  ParsedCalculationView,
  CalculationViewType,
  InputConnection,
} from '../types';

export function parseCalculationView(xmlContent: string): ParsedCalculationView {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '_text',
  });

  const parsed = parser.parse(xmlContent) as any;
  const scenario = parsed['Calculation:scenario'];

  if (!scenario) {
    throw new Error('Invalid Calculation View XML: Missing Calculation:scenario root');
  }

  // Parse DataSources (Database Tables)
  const dataSources = Array.isArray(scenario.dataSources?.DataSource)
    ? scenario.dataSources.DataSource
    : scenario.dataSources?.DataSource
      ? [scenario.dataSources.DataSource]
      : [];

  // Parse CalculationViews (Nodes)
  const calcViewsRaw = Array.isArray(scenario.calculationViews?.calculationView)
    ? scenario.calculationViews.calculationView
    : scenario.calculationViews?.calculationView
      ? [scenario.calculationViews.calculationView]
      : [];

  // Also add logicalModel as an Aggregation node
  let calcViewsWithData = [...calcViewsRaw];
  if (scenario.logicalModel) {
    const logicalModel = {
      ...scenario.logicalModel,
      'xsi:type': 'Calculation:AggregationView', // logicalModel is typically an aggregation
    };
    calcViewsWithData.push(logicalModel);
  }

  const calculationViews: CalculationViewData[] = calcViewsWithData.map((view: any) => {
    const xsiType = view['xsi:type'] || '';
    const viewType: CalculationViewType = xsiType.replace('Calculation:', '') as CalculationViewType;

    // Parse view attributes
    const viewAttributes = Array.isArray(view.viewAttributes?.viewAttribute)
      ? view.viewAttributes.viewAttribute.map((attr: any) => ({
        id: attr.id,
        datatype: attr.datatype,
        length: attr.length,
      }))
      : view.viewAttributes?.viewAttribute
        ? [{ id: view.viewAttributes.viewAttribute.id }]
        : [];

    // Parse inputs (edge connections)
    const inputs: InputConnection[] = [];
    if (view.input) {
      const inputArray = Array.isArray(view.input) ? view.input : [view.input];
      inputArray.forEach((input: any) => {
        const nodeId = input.node?.replace('#', '');
        if (nodeId) {
          inputs.push({
            nodeId,
            mapping: Array.isArray(input.mapping)
              ? input.mapping.map((m: any) => ({ target: m.target, source: m.source }))
              : input.mapping
                ? [{ target: input.mapping.target, source: input.mapping.source }]
                : [],
          });
        }
      });
    }

    // Parse calculated view attributes
    const calcAttrs = Array.isArray(view.calculatedViewAttributes?.calculatedViewAttribute)
      ? view.calculatedViewAttributes.calculatedViewAttribute.map((attr: any) => ({
        id: attr.id,
        datatype: attr.datatype,
        length: attr.length,
        isCalculated: true,
        formula: attr.formula || attr._text,
      }))
      : view.calculatedViewAttributes?.calculatedViewAttribute
        ? [{
          id: view.calculatedViewAttributes.calculatedViewAttribute.id,
          datatype: view.calculatedViewAttributes.calculatedViewAttribute.datatype,
          isCalculated: true,
          formula: view.calculatedViewAttributes.calculatedViewAttribute.formula,
        }]
        : [];

    return {
      id: view.id,
      type: viewType,
      viewAttributes: [...viewAttributes, ...calcAttrs],
      inputs,
      joinType: view.joinType,
      filters: view.filter ? [view.filter] : [],
      calculatedViewAttributes: calcAttrs,
    };
  });

  // Parse Layout
  let layoutShapes: LayoutShape[] = [];
  if (scenario.layout?.shapes?.shape) {
    const shapes = Array.isArray(scenario.layout.shapes.shape)
      ? scenario.layout.shapes.shape
      : [scenario.layout.shapes.shape];

    layoutShapes = shapes.map((shape: any) => ({
      modelObjectName: shape.modelObjectName,
      x: parseInt(shape.upperLeftCorner?.x || '0', 10),
      y: parseInt(shape.upperLeftCorner?.y || '0', 10),
      expanded: shape.expanded === 'true',
      rectWidth: shape.rectangleSize?.width ?? shape.rectangleSize?.['@_width'] ?? '0',
      rectHeight: shape.rectangleSize?.height ?? shape.rectangleSize?.['@_height'] ?? '0',
    }));
  }

  return {
    id: scenario.id,
    dataSources,
    calculationViews,
    layoutShapes,
    outputs: scenario.outputs?.output,
  };
}

export function transformToReactFlow(
  parsed: ParsedCalculationView
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const idToType = new Map<string, CalculationViewType>();
  const idToPosition = new Map<string, { x: number; y: number }>();

  // Store positions from layout
  parsed.layoutShapes.forEach((shape) => {
    idToPosition.set(shape.modelObjectName, { x: shape.x, y: shape.y });
  });

  // Create data source nodes — only if they have a shape in the layout
  parsed.dataSources.forEach((ds) => {
    if (!idToPosition.has(ds.id)) return; // no shape → not visible
    const pos = idToPosition.get(ds.id)!;
    nodes.push({
      id: ds.id,
      type: 'dataSource',
      position: { x: pos.x, y: pos.y },
      data: {
        id: ds.id,
        type: 'DATA_BASE_TABLE',
        label: ds.columnObjectName || ds.id,
        isDataSource: true,
        dataSourceInfo: {
          schemaName: ds.schemaName,
          columnObjectName: ds.columnObjectName,
        },
      },
    });
    idToType.set(ds.id, 'DATA_BASE_TABLE');
  });

  // Create calculation view nodes — only if they have a shape in the layout
  parsed.calculationViews.forEach((cv) => {
    if (!idToPosition.has(cv.id)) return; // no shape → not visible
    const pos = idToPosition.get(cv.id)!;
    const nodeType = cv.type === 'JoinView' ? 'joinNode' :
      cv.type === 'AggregationView' ? 'aggregationNode' :
        cv.type === 'ProjectionView' ? 'projectionNode' :
          cv.type === 'UnionView' ? 'unionNode' :
            'default';

    nodes.push({
      id: cv.id,
      type: nodeType,
      position: { x: pos.x, y: pos.y },
      data: {
        id: cv.id,
        type: cv.type,
        label: cv.id,
        attributes: cv.viewAttributes,
        joinType: cv.joinType,
        inputs: cv.inputs,
      },
    });
    idToType.set(cv.id, cv.type);
  });

  // Set of all defined node IDs — used to skip edges referencing external/undefined nodes
  const knownIds = new Set(idToType.keys());

  // Create edges from input connections — only between defined/visible nodes
  parsed.calculationViews.forEach((cv) => {
    if (cv.inputs) {
      cv.inputs.forEach((input) => {
        // Skip if source node is not defined in this file (no shape, external reference)
        if (!knownIds.has(input.nodeId)) return;
        edges.push({
          id: `${input.nodeId}-${cv.id}`,
          source: input.nodeId,
          target: cv.id,
          type: 'default',
          animated: false,
          style: { stroke: '#64748b' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
          data: {
            sourceLabel: input.nodeId,
            targetLabel: cv.id,
            mappings: input.mapping,
          },
        });
      });
    }
  });

  // Create output edges
  if (parsed.outputs) {
    const outputs = Array.isArray(parsed.outputs) ? parsed.outputs : [parsed.outputs];
    outputs.forEach((output: any) => {
      if (output.input) {
        const inputArray = Array.isArray(output.input) ? output.input : [output.input];
        inputArray.forEach((input: any) => {
          const sourceId = input.node?.replace('#', '');
          if (sourceId) {
            edges.push({
              id: `${sourceId}-Output`,
              source: sourceId,
              target: 'Output',
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#22c55e', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
              data: {
                sourceLabel: sourceId,
                targetLabel: 'Output',
              },
            });

            // Add Output node if not exists
            if (!nodes.find((n) => n.id === 'Output')) {
              const pos = idToPosition.get('Output') || { x: 70, y: 60 };
              nodes.push({
                id: 'Output',
                type: 'outputNode',
                position: { x: pos.x, y: pos.y },
                data: {
                  id: 'Output',
                  type: 'Output',
                  label: 'Output',
                },
              });
            }
          }
        });
      }
    });
  }

  return { nodes, edges };
}

export function exportToXml(
  originalXml: string,
  nodes: Node[],
  originalShapes?: { modelObjectName: string; rectWidth: string | number; rectHeight: string | number }[]
): string {
  // Build a quick lookup for original rectangleSize values
  const rectSizeMap = new Map<string, { w: string; h: string }>();
  if (originalShapes) {
    originalShapes.forEach((s) => {
      rectSizeMap.set(s.modelObjectName, { w: String(s.rectWidth), h: String(s.rectHeight) });
    });
  }

  // Build new <shapes> content with current node positions
  const shapesXml = nodes
    .map((node) => {
      // positionAbsolute is set by React Flow after layout; position may lag in flat (non-nested) graphs
      const pos = (node as any).positionAbsolute ?? node.position;
      const x = Math.round(pos.x);
      const y = Math.round(pos.y);
      const ns = node.type === 'dataSource' ? 'DataSource'
        : node.type === 'outputNode' ? 'MeasureGroup'
          : 'CalculationView';
      // Preserve original rectangleSize; fall back to '0' (SAP default) if unknown
      const rect = rectSizeMap.get(node.id) ?? { w: '0', h: '0' };
      return `      <shape expanded="true" modelObjectName="${node.id}" modelObjectNameSpace="${ns}">\n        <upperLeftCorner x="${x}" y="${y}"/>\n        <rectangleSize height="${rect.h}" width="${rect.w}"/>\n      </shape>`;
    })
    .join('\n');

  const newLayoutBlock = `  <layout>\n    <shapes>\n${shapesXml}\n    </shapes>\n  </layout>`;

  // Find the LAST <layout>...</layout> block — the file may contain an earlier <layout>
  // inside <privateDataFoundation> which must NOT be touched; the real position layout
  // is always the last one, immediately before </Calculation:scenario>.
  const LAYOUT_OPEN = '<layout>';
  const LAYOUT_CLOSE = '</layout>';
  const lastLayoutStart = originalXml.lastIndexOf(LAYOUT_OPEN);
  if (lastLayoutStart !== -1) {
    const lastLayoutEnd = originalXml.indexOf(LAYOUT_CLOSE, lastLayoutStart);
    if (lastLayoutEnd !== -1) {
      return (
        originalXml.substring(0, lastLayoutStart) +
        newLayoutBlock +
        originalXml.substring(lastLayoutEnd + LAYOUT_CLOSE.length)
      );
    }
  }

  // No layout section exists yet — insert before closing </Calculation:scenario>
  return originalXml.replace(
    '<\/Calculation:scenario>',
    newLayoutBlock + '\n<\/Calculation:scenario>'
  );
}
