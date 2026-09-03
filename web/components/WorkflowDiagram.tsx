"use client";

import ReactFlow, { Background, Controls, Handle, Position, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import { Webhook, GitBranch, Clock3, Send, MessageCircleMore, Check } from "lucide-react";

type WorkflowNodeData = {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  done?: boolean;
};

function WorkflowNode({ data }: { data: WorkflowNodeData }) {
  return (
    <div className="relative flex w-[148px] flex-col items-center">
      <div className="flex h-[78px] w-[148px] flex-col items-center justify-center rounded-[16px] border border-[#e5e3df] bg-white shadow-[0_4px_16px_rgba(16,17,20,0.06)]">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${data.iconBg} ${data.iconColor}`}>{data.icon}</div>
        <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-2 !border-white !bg-[#d6d3cd]" />
        <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-2 !border-white !bg-[#d6d3cd]" />
        {data.done && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] font-bold tracking-wide text-[#101114]">{data.label}</p>
      {data.sublabel && <p className="text-center text-[10px] leading-tight text-[#918d85]">{data.sublabel}</p>}
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNode };

export default function WorkflowDiagram() {
  const nodes: Node[] = [
    {
      id: "webhook",
      type: "workflow",
      position: { x: 0, y: 80 },
      data: {
        label: "Telegram",
        sublabel: "Group message",
        icon: <Webhook className="h-4 w-4" />,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        done: true,
      },
    },
    {
      id: "ifelse",
      type: "workflow",
      position: { x: 240, y: 80 },
      data: {
        label: "Quorum Check",
        sublabel: "If / Else",
        icon: <GitBranch className="h-4 w-4" />,
        iconBg: "bg-orange-50",
        iconColor: "text-[#ff4f18]",
        done: true,
      },
    },
    {
      id: "wait",
      type: "workflow",
      position: { x: 480, y: 80 },
      data: {
        label: "Governance",
        sublabel: "Wait · 30m",
        icon: <Clock3 className="h-4 w-4" />,
        iconBg: "bg-stone-100",
        iconColor: "text-stone-500",
      },
    },
    {
      id: "swap",
      type: "workflow",
      position: { x: 720, y: 0 },
      data: {
        label: "Aerodrome Swap",
        sublabel: "USDC → NVDAc",
        icon: <Send className="h-4 w-4" />,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
    },
    {
      id: "receipt",
      type: "workflow",
      position: { x: 720, y: 160 },
      data: {
        label: "Telegram Receipt",
        sublabel: "Bot posts proof",
        icon: <MessageCircleMore className="h-4 w-4" />,
        iconBg: "bg-violet-50",
        iconColor: "text-violet-600",
      },
    },
  ];

  const edges: Edge[] = [
    {
      id: "e1",
      source: "webhook",
      target: "ifelse",
      type: "smoothstep",
      style: { stroke: "#d6d3cd", strokeWidth: 1.5, strokeDasharray: "6 6" },
    },
    {
      id: "e2-yes",
      source: "ifelse",
      target: "wait",
      sourceHandle: null as any,
      type: "smoothstep",
      label: "Yes",
      labelStyle: { fill: "#059669", fontSize: 10, fontWeight: 700 },
      labelBgStyle: { fill: "#ecfdf5", stroke: "#a7f3d0" },
      style: { stroke: "#10b981", strokeWidth: 1.5, strokeDasharray: "6 6" },
    },
    {
      id: "e3-no",
      source: "ifelse",
      target: "wait",
      type: "smoothstep",
      label: "No",
      labelStyle: { fill: "#dc2626", fontSize: 10, fontWeight: 700 },
      labelBgStyle: { fill: "#fef2f2", stroke: "#fecaca" },
      style: { stroke: "#ef4444", strokeWidth: 1.5, strokeDasharray: "6 6" },
    },
    {
      id: "e4",
      source: "wait",
      target: "swap",
      type: "smoothstep",
      style: { stroke: "#3b82f6", strokeWidth: 1.5, strokeDasharray: "6 6" },
    },
    {
      id: "e5",
      source: "wait",
      target: "receipt",
      type: "smoothstep",
      style: { stroke: "#8b5cf6", strokeWidth: 1.5, strokeDasharray: "6 6" },
    },
  ];

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e3dfd7] bg-white">
      <div className="flex items-center justify-between border-b border-[#f0ede8] px-6 py-4">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">SYNDICATE LOOP</p>
          <h3 className="mt-1 font-[var(--font-newsreader)] text-[15px] font-medium tracking-tight text-[#101114]">Telegram intent → B20 execution</h3>
        </div>
        <span className="hidden rounded-full bg-[#f5f3ee] px-3 py-1.5 text-[11px] font-bold text-[#77736c] md:inline">React Flow · Base Sepolia proof</span>
      </div>

      <div className="h-[340px] w-full bg-white">
        <ReactFlow
          nodes={nodes as any}
          edges={edges as any}
          nodeTypes={nodeTypes as any}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll
          zoomOnScroll
          className="bg-white"
        >
          <Background color="#f5f3ee" gap={20} size={1} />
          <Controls showInteractive={false} className="!rounded-xl !border-[#e3dfd7] !shadow-sm" />
        </ReactFlow>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ede8] bg-[#fcfaf8] px-6 py-3 text-[10px] tracking-wide text-[#918d85]">
        <span>
          <span className="font-bold text-[#101114]">Webhook</span> → <span className="font-bold text-[#ff4f18]">If / Else</span> → <span className="font-bold text-stone-500">Wait</span> →{" "}
          <span className="font-bold text-blue-600">Aerodrome</span> <span className="text-[#918d85]">/</span> <span className="font-bold text-violet-600">Telegram</span>
        </span>
        <span className="hidden md:inline">Yes = quorum met (green) · No = blocked (red) · Dashed = async</span>
      </div>
    </div>
  );
}
