import { useBuilderContext } from '../context/WorkflowBuilderContext';

const NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 88;

/**
 * Measure the actual rendered height of a step node in the DOM.
 * Falls back to DEFAULT_NODE_HEIGHT if the element is not found.
 */
function getStepHeight(stepId: string): number {
  const el = document.querySelector<HTMLElement>(`[data-step-id="${stepId}"]`);
  return el ? el.offsetHeight : DEFAULT_NODE_HEIGHT;
}

export function ConnectionOverlay() {
  const { state, dispatch } = useBuilderContext();

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={{ zIndex: 0 }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
        </marker>
        <marker
          id="arrowhead-selected"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
        </marker>
      </defs>

      {state.connections.map(conn => {
        const fromStep = state.steps.find(s => s.id === conn.fromStepId);
        const toStep = state.steps.find(s => s.id === conn.toStepId);
        if (!fromStep || !toStep) return null;

        const isSelected = state.selectedConnectionId === conn.id;

        // Measure actual rendered heights (falls back to DEFAULT_NODE_HEIGHT)
        const fromHeight = getStepHeight(fromStep.id);

        // From: bottom center of source node
        const x1 = fromStep.position.x + NODE_WIDTH / 2;
        const y1 = fromStep.position.y + fromHeight;
        // To: top center of target node
        const x2 = toStep.position.x + NODE_WIDTH / 2;
        const y2 = toStep.position.y;

        // Bezier control points
        const dy = Math.abs(y2 - y1);
        const cp = Math.max(40, dy * 0.4);
        const path = `M ${x1} ${y1} C ${x1} ${y1 + cp}, ${x2} ${y2 - cp}, ${x2} ${y2}`;

        // Label position: midpoint of the bezier
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        return (
          <g key={conn.id}>
            {/* Invisible wider path for easier clicking */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'SELECT_CONNECTION', payload: { id: conn.id } });
              }}
            />
            {/* Visible path */}
            <path
              d={path}
              fill="none"
              stroke={isSelected ? '#6366f1' : '#94a3b8'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              strokeDasharray={isSelected ? '' : ''}
              markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
            />
            {/* Action label */}
            <g transform={`translate(${midX}, ${midY})`}>
              <rect
                x={-conn.action.length * 3.5 - 6}
                y={-10}
                width={conn.action.length * 7 + 12}
                height={20}
                rx={4}
                fill={isSelected ? '#eef2ff' : '#f8fafc'}
                stroke={isSelected ? '#6366f1' : '#cbd5e1'}
                strokeWidth={1}
                className="pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'SELECT_CONNECTION', payload: { id: conn.id } });
                }}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none text-[11px] font-medium"
                fill={isSelected ? '#4338ca' : '#64748b'}
              >
                {conn.action}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
