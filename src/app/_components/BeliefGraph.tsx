'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BeliefSystem } from '@/types/agent';

type Tier = 'value' | 'domain' | 'issue';

interface BeliefNodeData extends Record<string, unknown> {
  label: string;
  tier: Tier;
  dimmed: boolean;
}

const TIER_Y = { value: 0, domain: 200, issue: 400 };
const NODE_SPACING = 180;
const NODE_WIDTH = 150;

function BeliefNodeView({ data, selected }: NodeProps<Node<BeliefNodeData>>) {
  const tierStyles: Record<Tier, string> = {
    value: 'bg-stone-900 text-white border-stone-900',
    domain: 'bg-stone-100 text-stone-900 border-stone-300',
    issue: 'bg-white text-stone-700 border-stone-200',
  };

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-center text-xs font-medium leading-tight shadow-sm transition-opacity ${
        tierStyles[data.tier]
      } ${data.dimmed ? 'opacity-30' : 'opacity-100'} ${
        selected ? 'ring-2 ring-offset-1 ring-stone-900' : ''
      }`}
      style={{ width: NODE_WIDTH }}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-transparent" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-transparent" />
    </div>
  );
}

const nodeTypes = { belief: BeliefNodeView };

export function BeliefGraph({
  beliefSystem,
  variant,
}: {
  beliefSystem: BeliefSystem;
  variant: 'liberal' | 'conservative';
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null);

  const accentText = variant === 'liberal' ? 'text-sky-700' : 'text-rose-700';

  // Set of nodes related to the current selection (selection + ancestors + descendants).
  // Anything outside this set is dimmed.
  const relatedIds = useMemo(() => {
    if (!selectedId) return null;
    const set = new Set<string>([selectedId]);
    const cv = beliefSystem.coreValues.find(c => c.id === selectedId);
    const da = beliefSystem.domainAreas.find(d => d.id === selectedId);
    const si = beliefSystem.specificIssues.find(s => s.id === selectedId);
    if (cv) {
      cv.domainAreaIds.forEach(daId => {
        set.add(daId);
        beliefSystem.domainAreas
          .find(d => d.id === daId)
          ?.specificIssueIds.forEach(siId => set.add(siId));
      });
    } else if (da) {
      da.coreValueIds.forEach(id => set.add(id));
      da.specificIssueIds.forEach(id => set.add(id));
    } else if (si) {
      si.domainAreaIds.forEach(daId => {
        set.add(daId);
        beliefSystem.domainAreas
          .find(d => d.id === daId)
          ?.coreValueIds.forEach(cvId => set.add(cvId));
      });
    }
    return set;
  }, [selectedId, beliefSystem]);

  const isDimmed = useCallback(
    (id: string) => relatedIds !== null && !relatedIds.has(id),
    [relatedIds],
  );

  const nodes = useMemo<Node<BeliefNodeData>[]>(() => {
    const result: Node<BeliefNodeData>[] = [];

    const layRow = <T extends { id: string; label: string }>(
      items: T[],
      y: number,
      tier: Tier,
    ) => {
      const total = items.length * NODE_SPACING;
      items.forEach((item, i) => {
        result.push({
          id: item.id,
          type: 'belief',
          position: { x: i * NODE_SPACING - total / 2, y },
          data: { label: item.label, tier, dimmed: isDimmed(item.id) },
        });
      });
    };

    layRow(beliefSystem.coreValues, TIER_Y.value, 'value');
    layRow(beliefSystem.domainAreas, TIER_Y.domain, 'domain');

    if (expandedDomainId) {
      const da = beliefSystem.domainAreas.find(d => d.id === expandedDomainId);
      if (da) {
        const issues = da.specificIssueIds
          .map(id => beliefSystem.specificIssues.find(s => s.id === id))
          .filter((s): s is NonNullable<typeof s> => !!s);
        layRow(issues, TIER_Y.issue, 'issue');
      }
    }
    return result;
  }, [beliefSystem, expandedDomainId, isDimmed]);

  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = [];
    const visibleIds = new Set(nodes.map(n => n.id));

    const edgeStyle = (fromId: string, toId: string) => {
      const dim = relatedIds !== null && !(relatedIds.has(fromId) && relatedIds.has(toId));
      return {
        stroke: dim ? '#e7e5e4' : '#a8a29e',
        strokeWidth: 1.5,
        opacity: dim ? 0.4 : 1,
      };
    };

    beliefSystem.coreValues.forEach(cv => {
      cv.domainAreaIds.forEach(daId => {
        if (visibleIds.has(cv.id) && visibleIds.has(daId)) {
          result.push({
            id: `${cv.id}->${daId}`,
            source: cv.id,
            target: daId,
            type: 'smoothstep',
            style: edgeStyle(cv.id, daId),
          });
        }
      });
    });

    if (expandedDomainId) {
      const da = beliefSystem.domainAreas.find(d => d.id === expandedDomainId);
      da?.specificIssueIds.forEach(siId => {
        if (visibleIds.has(expandedDomainId) && visibleIds.has(siId)) {
          result.push({
            id: `${expandedDomainId}->${siId}`,
            source: expandedDomainId,
            target: siId,
            type: 'smoothstep',
            style: edgeStyle(expandedDomainId, siId),
          });
        }
      });
    }

    return result;
  }, [beliefSystem, expandedDomainId, relatedIds, nodes]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedId(node.id);
      const tier = (node.data as BeliefNodeData).tier;
      if (tier === 'domain') {
        setExpandedDomainId(prev => (prev === node.id ? null : node.id));
      }
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    const cv = beliefSystem.coreValues.find(c => c.id === selectedId);
    if (cv) return { id: cv.id, label: cv.label, description: cv.description, tier: 'value' as const };
    const da = beliefSystem.domainAreas.find(d => d.id === selectedId);
    if (da) return { id: da.id, label: da.label, description: da.description, tier: 'domain' as const };
    const si = beliefSystem.specificIssues.find(s => s.id === selectedId);
    if (si) return { id: si.id, label: si.label, description: si.description, tier: 'issue' as const };
    return null;
  }, [selectedId, beliefSystem]);

  const reset = () => {
    setSelectedId(null);
    setExpandedDomainId(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50/70 px-5 py-3 text-xs text-stone-500">
        <span>Click a domain to expand its specific issues. Click any node to highlight its connections.</span>
        {(selectedId || expandedDomainId) && (
          <button
            onClick={reset}
            className="ml-auto rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 flex-1 bg-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.25}
            maxZoom={1.75}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
          >
            <Background color="#e7e5e4" gap={24} />
            <Controls showInteractive={false} className="!shadow-sm" />
          </ReactFlow>
        </div>

        <aside className="hidden w-80 flex-shrink-0 overflow-y-auto border-l border-stone-200 bg-stone-50/60 p-5 lg:block">
          {selectedNode ? (
            <NodeDetails
              node={selectedNode}
              beliefSystem={beliefSystem}
              accentText={accentText}
              onJump={(id, isDomain) => {
                setSelectedId(id);
                if (isDomain) setExpandedDomainId(id);
              }}
            />
          ) : (
            <div className="text-sm">
              <p className="font-medium text-stone-700">Select a node</p>
              <p className="mt-2 text-xs leading-relaxed text-stone-500">
                Click any belief in the graph to see its description and the beliefs it&apos;s connected to.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function NodeDetails({
  node,
  beliefSystem,
  accentText,
  onJump,
}: {
  node: { id: string; label: string; description: string; tier: Tier };
  beliefSystem: BeliefSystem;
  accentText: string;
  onJump: (id: string, isDomain: boolean) => void;
}) {
  const tierLabel = node.tier === 'value' ? 'Core value' : node.tier === 'domain' ? 'Policy domain' : 'Specific issue';

  let parents: Array<{ id: string; label: string; isDomain: boolean }> = [];
  let children: Array<{ id: string; label: string; isDomain: boolean }> = [];

  if (node.tier === 'value') {
    const cv = beliefSystem.coreValues.find(c => c.id === node.id);
    children = (cv?.domainAreaIds ?? [])
      .map(id => beliefSystem.domainAreas.find(d => d.id === id))
      .filter((d): d is NonNullable<typeof d> => !!d)
      .map(d => ({ id: d.id, label: d.label, isDomain: true }));
  } else if (node.tier === 'domain') {
    const da = beliefSystem.domainAreas.find(d => d.id === node.id);
    parents = (da?.coreValueIds ?? [])
      .map(id => beliefSystem.coreValues.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map(c => ({ id: c.id, label: c.label, isDomain: false }));
    children = (da?.specificIssueIds ?? [])
      .map(id => beliefSystem.specificIssues.find(s => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map(s => ({ id: s.id, label: s.label, isDomain: false }));
  } else {
    const si = beliefSystem.specificIssues.find(s => s.id === node.id);
    parents = (si?.domainAreaIds ?? [])
      .map(id => beliefSystem.domainAreas.find(d => d.id === id))
      .filter((d): d is NonNullable<typeof d> => !!d)
      .map(d => ({ id: d.id, label: d.label, isDomain: true }));
  }

  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className={`text-[10px] font-semibold uppercase tracking-wider ${accentText}`}>{tierLabel}</div>
        <h3 className="mt-1 text-base font-semibold text-stone-900">{node.label}</h3>
      </div>
      <p className="leading-relaxed text-stone-700">{node.description}</p>

      {parents.length > 0 && (
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            {parents.length === 1 ? 'Parent' : 'Parents'}
          </div>
          <div className="flex flex-wrap gap-1">
            {parents.map(p => (
              <button
                key={p.id}
                onClick={() => onJump(p.id, p.isDomain)}
                className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 transition-colors hover:bg-stone-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {children.length > 0 && (
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            {children.length === 1 ? 'Child' : 'Children'}
          </div>
          <div className="flex flex-wrap gap-1">
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => onJump(c.id, c.isDomain)}
                className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 transition-colors hover:bg-stone-50"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
