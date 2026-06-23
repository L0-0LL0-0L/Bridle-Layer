"use client";

import { useMemo } from "react";
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Resource, ResourceConnection } from "@/lib/types";
import { resourceTypeLabel } from "@/lib/utils";

export function NetworkGraph({ resources, connections }: { resources: Resource[]; connections: ResourceConnection[] }) {
  const nodes = useMemo<Node[]>(
    () =>
      resources.map((resource, index) => ({
        id: resource.id,
        position: {
          x: (index % 3) * 280,
          y: Math.floor(index / 3) * 170
        },
        data: {
          label: (
            <div className="border-2 border-white bg-black px-4 py-3 text-white shadow-[5px_5px_0_rgba(255,255,255,0.18)]">
              <div className="mb-2 font-pixel text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                {resourceTypeLabel(resource.type)}
              </div>
              <div className="font-pixel text-[10px] leading-5">{resource.name}</div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">{resource.status}</div>
            </div>
          )
        },
        style: {
          background: "transparent",
          border: 0,
          color: "white",
          width: 220
        }
      })),
    [resources]
  );

  const edges = useMemo<Edge[]>(
    () =>
      connections.map((connection) => ({
        id: connection.id,
        source: connection.sourceId,
        target: connection.targetId,
        label: connection.label,
        animated: connection.status === "live",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#fff"
        },
        style: {
          stroke: connection.status === "paused" ? "#777" : "#fff",
          strokeWidth: 2
        },
        labelStyle: {
          fill: "#fff",
          fontFamily: "IBM Plex Mono",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase"
        }
      })),
    [connections]
  );

  return (
    <div className="h-[560px] border-2 border-white/60 bg-black">
      <ReactFlow edges={edges} fitView nodes={nodes} proOptions={{ hideAttribution: true }}>
        <Background color="#444" gap={24} />
        <Controls className="!rounded-none !border-2 !border-white !bg-black !text-white" />
      </ReactFlow>
    </div>
  );
}
