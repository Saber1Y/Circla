"use client";

import ReactFlow, { Background, Controls, Handle, Position, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import { MessageCircle, GitBranch, Clock3, Send, Bot, Check } from "lucide-react";

type WorkflowNodeData = {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  done?: boolean;
};

function WorkflowNode({ data }: { data: WorkflowNodeData }) {
  return (
    <div className="relative flex w-[156px] flex-col items-center">
      <div className="flex h-[78px] w-[156px] flex-col items-center justify-center rounded-[16px] border border-[#e5e3df] bg-white shadow-[0_4px_16px_rgba(16,17,20,0.06)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-[#d94a1e]">{data.icon}</div>
        <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-2 !border-white !bg-[#d6d3cd]" />
        <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-2 !border-white !bg-[#d6d3cd]" />
        {data.done && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d94a1e] text-white shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] font-bold tracking-wide text-[#101114]">{data.label}</p>
      {data.sublabel && <p className="text-center text-[10px] leading-tight text-[#77736c]">{data.sublabel}</p>}
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNode };

export default function WorkflowDiagram() {
  const nodes: Node[] = [
    {
      id: "telegram",
      type: "workflow",
      position: { x: 0, y: 80 },
      data: { label: "Telegram", sublabel: "Group message (/contribute)", icon: <MessageCircle className="h-4 w-4" />, done: true },
    },
    {
      id: "quorum",
      type: "workflow",
      position: { x: 240, y: 80 },
      data: { label: "Quorum Check", sublabel: "If / Else ($250 threshold)", icon: <GitBranch className="h-4 w-4" />, done: true },
    },
    {
      id: "governance",
      type: "workflow",
      position: { x: 480, y: 80 },
      data: { label: "Governance", sublabel: "Batch window · Ready", icon: <Clock3 className="h-4 w-4" /> },
    },
    {
      id: "swap",
      type: "workflow",
      position: { x: 720, y: 0 },
      data: { label: "Aerodrome Swap", sublabel: "USDC → NVDAc", icon: <Send className="h-4 w-4" /> },
    },
    {
      id: "receipt",
      type: "workflow",
      position: { x: 720, y: 160 },
      data: { label: "Telegram Receipt", sublabel: "Bot posts proof", icon: <Bot className="h-4 w-4" /> },
    },
  ];

  const edges: Edge[] = [
    {
      id: "e-telegram-quorum",
      source: "telegram",
      target: "quorum",
      type: "smoothstep",
      animated: true,
      style: { stroke: "#0052FF", strokeWidth: 1.5, strokeDasharray: "6 6", opacity: 0.35 },
    },
    {
      id: "e-quorum-gov-yes",
      source: "quorum",
      target: "governance",
      type: "smoothstep",
      label: "Yes",
      labelStyle: { fill: "#0052FF", fontSize: 10, fontWeight: 700 },
      labelBgStyle: { fill: "#EFF6FF", stroke: "#0052FF", strokeOpacity: 0.2 },
      style: { stroke: "#0052FF", strokeWidth: 1.5, strokeDasharray: "6 6" },
    },
    {
      id: "e-quorum-gov-no",
      source: "quorum",
      target: "governance",
      type: "smoothstep",
      label: "No",
      labelStyle: { fill: "#0052FF", fontSize: 10, fontWeight: 700 },
      labelBgStyle: { fill: "white", stroke: "#0052FF", strokeOpacity: 0.2 },
      style: { stroke: "#0052FF", strokeWidth: 1.2, strokeDasharray: "6 6", opacity: 0.45 },
    },
    {
      id: "e-gov-swap",
      source: "governance",
      target: "swap",
      type: "smoothstep",
      style: { stroke: "#0052FF", strokeWidth: 1.5, strokeDasharray: "6 6" },
    },
    {
      id: "e-gov-receipt",
      source: "governance",
      target: "receipt",
      type: "smoothstep",
      style: { stroke: "#0052FF", strokeWidth: 1.5, strokeDasharray: "6 6", opacity: 0.9 },
    },
  ];

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e3dfd7] bg-white">
      <div className="flex items-center justify-between border-b border-[#f0ede8] px-6 py-4">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">SYNDICATE LOOP</p>
          <h3 className="mt-1 font-[var(--font-sora)] text-[15px] font-semibold tracking-tight text-[#101114]">Chat intent → B20 execution</h3>
          <p className="mt-1 max-w-[560px] font-[var(--font-sora)] text-[11px] leading-relaxed text-[#77736c]">Flexible execution system — compose intent, portfolio logic, quotes, routes, and settlement dynamically. Same design system as the landing.</p>
        </div>
        <span className="hidden rounded-full bg-[#EFF6FF] px-3 py-1.5 text-[11px] font-bold text-[#0052FF] md:inline">React Flow · Base proof</span>
      </div>

      <div className="h-[360px] w-full bg-white">
        <ReactFlow
          nodes={nodes as any}
          edges={edges as any}
          nodeTypes={nodeTypes as any}
          fitView
          fitViewOptions={{ padding: 0.22 }}
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ede8] bg-[#fcfaf8] px-6 py-3 text-[10px] tracking-wide text-[#77736c]">
        <span className="font-[var(--font-sora)]">
          <span className="font-bold text-[#0052FF]">Telegram</span> → <span className="font-bold text-[#0052FF]">Quorum Check</span> → <span className="font-bold text-[#0052FF]">Governance</span> → <span className="font-bold text-[#0052FF]">Aerodrome Swap</span> <span className="text-[#d6d3cd]">/</span> <span className="font-bold text-[#0052FF]">Telegram Receipt</span>
        </span>
        <span className="hidden font-[var(--font-sora)] md:inline">Yes = quorum met · No = waiting · Dashed = async · Base blue + white only</span>
      </div>
      <p className="border-t border-[#f0ede8] bg-white px-6 py-2 text-center font-[var(--font-sora)] text-[10px] tracking-wide text-[#b8b4ad]">Architecture canvas — compose intent, analysis, portfolio, quotes, routes, settlement, and conditions dynamically. Not a fixed workflow.</p>
    </div>
  );
}
