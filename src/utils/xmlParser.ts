import { XMLParser } from 'fast-xml-parser';
import { Node, Edge, MarkerType } from 'reactflow';
import {
  CalculationViewData,
  LayoutShape,
  ParsedCalculationView,
  CalculationViewType,
  InputConnection,
  ViewerGroup,
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

  const getCommentText = (desc: any) => {
    let text = undefined;
    if (!desc?.comment) return undefined;
    if (Array.isArray(desc.comment)) {
      text = desc.comment.map((c: any) => c.text).filter(Boolean).join('\n');
    } else {
      text = desc.comment.text;
    }
    if (typeof text === 'string') {
      return text
        .replace(/&#xD;/g, '\r')
        .replace(/&#xA;/g, '\n')
        .replace(/&#x9;/g, '\t')
        .replace(/&#x20;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
    }
    return text;
  };

  const decodeEntities = (text: string): string =>
    text
      .replace(/&#xD;/g, '\r')
      .replace(/&#xA;/g, '\n')
      .replace(/&#x9;/g, '\t')
      .replace(/&#x20;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");

  const getFilterText = (filterRaw: any): string | undefined => {
    if (!filterRaw) return undefined;
    // filter element may be a string directly, or have a _text child, or multiple sub-elements
    if (typeof filterRaw === 'string') return decodeEntities(filterRaw);
    if (typeof filterRaw._text === 'string') return decodeEntities(filterRaw._text);
    // Try JSON serialisation as fallback for complex structures
    try { return decodeEntities(JSON.stringify(filterRaw, null, 2)); } catch { return undefined; }
  };

  const globalComment = getCommentText(scenario.descriptions);

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

  const calculationViews: CalculationViewData[] = calcViewsRaw.map((view: any) => {
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
      comment: getCommentText(view.descriptions),
      filter: getFilterText(view.filter),
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

  // Parse viewerGroups (custom viewer extension)
  const viewerGroups: ViewerGroup[] = [];
  const viewerGroupsRaw = scenario.viewerGroups?.group;
  if (viewerGroupsRaw) {
    const arr = Array.isArray(viewerGroupsRaw) ? viewerGroupsRaw : [viewerGroupsRaw];
    arr.forEach((g: any) => {
      const commentVal = g.comment;
      const commentText = typeof commentVal === 'string' ? commentVal
        : typeof commentVal?._text === 'string' ? commentVal._text
        : undefined;
      viewerGroups.push({
        id: g.id,
        title: g.title,
        comment: commentText,
        x: parseInt(g.position?.x ?? '0', 10),
        y: parseInt(g.position?.y ?? '0', 10),
        width: parseInt(g.position?.width ?? '300', 10),
        height: parseInt(g.position?.height ?? '200', 10),
        memberIds: Array.isArray(g.members?.member)
          ? g.members.member.map((m: any) => m.nodeId)
          : g.members?.member ? [g.members.member.nodeId] : [],
        borderColor: g.borderColor,
        bgColor: g.bgColor,
        titleColor: g.titleColor,
        commentColor: g.commentColor,
      });
    });
  }

  return {
    id: scenario.id,
    dataSources,
    calculationViews,
    layoutShapes,
    outputs: scenario.outputs?.output,
    logicalModel: scenario.logicalModel,
    globalComment,
    viewerGroups,
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
        comment: cv.comment,
        filter: cv.filter,
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
  // Create output (Semantics) edges and node
  if (parsed.logicalModel) {
    const sourceId = parsed.logicalModel.id;
    if (sourceId && nodes.find((n) => n.id === sourceId)) {
      edges.push({
        id: `${sourceId}-Output`,
        source: sourceId,
        target: 'Output',
        type: 'default',
        animated: false,
        style: { stroke: '#22c55e', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
        data: {
          sourceLabel: sourceId,
          targetLabel: 'Semantics',
        },
      });
    }

    if (!nodes.find((n) => n.id === 'Output')) {
      const pos = idToPosition.get('Output') || { x: 70, y: 60 };

      const attributes = Array.isArray(parsed.logicalModel.attributes?.attribute)
        ? parsed.logicalModel.attributes.attribute.map((a: any) => ({ id: a.id, datatype: 'attribute' }))
        : parsed.logicalModel.attributes?.attribute
          ? [{ id: parsed.logicalModel.attributes.attribute.id, datatype: 'attribute' }]
          : [];

      const measures = Array.isArray(parsed.logicalModel.baseMeasures?.measure)
        ? parsed.logicalModel.baseMeasures.measure.map((m: any) => ({ id: m.id, datatype: 'measure' }))
        : parsed.logicalModel.baseMeasures?.measure
          ? [{ id: parsed.logicalModel.baseMeasures.measure.id, datatype: 'measure' }]
          : [];

      nodes.push({
        id: 'Output',
        type: 'outputNode',
        position: { x: pos.x, y: pos.y - 80 },
        data: {
          id: 'Output',
          type: 'Semantics',
          label: 'Semantics',
          attributes: [...attributes, ...measures],
          comment: parsed.globalComment,
        },
      });
    }
  } else if (parsed.outputs) {
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
              type: 'default',
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

  // Reconstruct groups from parsed viewerGroups
  if (parsed.viewerGroups && parsed.viewerGroups.length > 0) {
    const groupNodes: Node[] = [];
    parsed.viewerGroups.forEach((group) => {
      groupNodes.push({
        id: group.id,
        type: 'groupNode',
        position: { x: group.x, y: group.y },
        style: { width: group.width, height: group.height },
        zIndex: -1,
        data: {
          id: group.id,
          label: group.title,
          comment: group.comment,
          borderColor: group.borderColor,
          bgColor: group.bgColor,
          titleColor: group.titleColor,
          commentColor: group.commentColor,
        },
      });
      // Convert member nodes from absolute to relative position and assign parentId
      nodes.forEach((n, i) => {
        if (group.memberIds.includes(n.id)) {
          nodes[i] = {
            ...n,
            parentId: group.id,
            position: { x: n.position.x - group.x, y: n.position.y - group.y },
          };
        }
      });
    });
    // Prepend group nodes so they appear before children (ReactFlow requirement)
    nodes.unshift(...groupNodes);
  }

  return { nodes, edges };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportToXml(
  originalXml: string,
  nodes: Node[],
  originalShapes?: { modelObjectName: string; rectWidth?: string | number; rectHeight?: string | number }[]
): string {
  // Build a quick lookup for original rectangleSize values
  const rectSizeMap = new Map<string, { w: string; h: string }>();
  if (originalShapes) {
    originalShapes.forEach((s) => {
      rectSizeMap.set(s.modelObjectName, { w: String(s.rectWidth), h: String(s.rectHeight) });
    });
  }

  // Separate group nodes from regular nodes
  const groupNodes = nodes.filter(n => n.type === 'groupNode');
  const regularNodes = nodes.filter(n => n.type !== 'groupNode');

  // Build new <shapes> content with current node positions (regular nodes only)
  const shapesXml = regularNodes
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

  // Build <viewerGroups> XML block
  let viewerGroupsXml = '';
  if (groupNodes.length > 0) {
    const groupElements = groupNodes.map(gn => {
      const pos = (gn as any).positionAbsolute ?? gn.position;
      const members = nodes
        .filter(n => n.parentId === gn.id)
        .map(n => `      <member nodeId="${n.id}"/>`)
        .join('\n');
      const commentXml = gn.data.comment
        ? `\n    <comment>${escapeXml(String(gn.data.comment))}</comment>`
        : '';
      return `  <group id="${gn.id}" title="${escapeXml(String(gn.data.label))}"` +
        (gn.data.borderColor ? ` borderColor="${escapeXml(gn.data.borderColor)}"` : '') +
        (gn.data.bgColor ? ` bgColor="${escapeXml(gn.data.bgColor)}"` : '') +
        (gn.data.titleColor ? ` titleColor="${escapeXml(gn.data.titleColor)}"` : '') +
        (gn.data.commentColor ? ` commentColor="${escapeXml(gn.data.commentColor)}"` : '') +
        `>`
        + commentXml
        + `\n    <position x="${Math.round(pos.x)}" y="${Math.round(pos.y)}" width="${Math.round(Number(gn.style?.width ?? 300))}" height="${Math.round(Number(gn.style?.height ?? 200))}"/>`
        + `\n    <members>\n${members}\n    </members>`
        + `\n  </group>`;
    }).join('\n');
    viewerGroupsXml = `\n<viewerGroups>\n${groupElements}\n</viewerGroups>`;
  }

  // Strip any existing <viewerGroups> block from original XML to avoid duplicates
  let xmlToProcess = originalXml.replace(/<viewerGroups>[\s\S]*?<\/viewerGroups>\n?/g, '');

  // Find the LAST <layout>...</layout> block — the file may contain an earlier <layout>
  // inside <privateDataFoundation> which must NOT be touched; the real position layout
  // is always the last one, immediately before </Calculation:scenario>.
  const LAYOUT_OPEN = '<layout>';
  const LAYOUT_CLOSE = '</layout>';
  const lastLayoutStart = xmlToProcess.lastIndexOf(LAYOUT_OPEN);
  if (lastLayoutStart !== -1) {
    const lastLayoutEnd = xmlToProcess.indexOf(LAYOUT_CLOSE, lastLayoutStart);
    if (lastLayoutEnd !== -1) {
      return (
        xmlToProcess.substring(0, lastLayoutStart) +
        newLayoutBlock +
        viewerGroupsXml +
        xmlToProcess.substring(lastLayoutEnd + LAYOUT_CLOSE.length)
      );
    }
  }

  // No layout section exists yet — insert before closing </Calculation:scenario>
  return xmlToProcess.replace(
    '<\/Calculation:scenario>',
    newLayoutBlock + viewerGroupsXml + '\n<\/Calculation:scenario>'
  );
}
