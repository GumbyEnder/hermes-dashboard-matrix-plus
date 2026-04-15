import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  type: "file" | "dir";
  children?: TreeNode[];
}

const MOCK_TREE: TreeNode[] = [
  {
    name: "src", type: "dir", children: [
      { name: "main.ts", type: "file" },
      { name: "agent.ts", type: "file" },
      {
        name: "skills", type: "dir", children: [
          { name: "search.ts", type: "file" },
          { name: "code.ts", type: "file" },
        ]
      },
    ]
  },
  { name: "config.yaml", type: "file" },
  { name: "README.md", type: "file" },
];

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);

  if (node.type === "file") {
    return (
      <button
        className="flex items-center gap-1.5 w-full px-2 py-0.5 text-xs hover:bg-row-hover rounded transition-colors"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <File size={12} className="text-hermes-muted shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-2 py-0.5 text-xs hover:bg-row-hover rounded transition-colors font-medium"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <ChevronRight size={12} className={cn("transition-transform shrink-0 text-hermes-muted", open && "rotate-90")} />
        {open ? <FolderOpen size={12} className="text-hermes-accent shrink-0" /> : <Folder size={12} className="text-hermes-accent shrink-0" />}
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children?.map((child) => (
        <TreeItem key={child.name} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function FileTree() {
  return (
    <div className="py-1">
      {MOCK_TREE.map((node) => (
        <TreeItem key={node.name} node={node} />
      ))}
    </div>
  );
}
