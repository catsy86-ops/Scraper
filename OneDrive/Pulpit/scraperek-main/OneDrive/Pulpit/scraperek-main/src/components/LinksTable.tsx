import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ExternalLink } from "lucide-react";

interface LinkEntry {
  index: number;
  url: string;
  domain: string;
}

interface Props {
  links: string[];
}

const LinksTable = ({ links }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const data = useMemo<LinkEntry[]>(
    () =>
      links.map((url, i) => {
        let domain = "";
        try {
          domain = new URL(url).hostname;
        } catch {
          domain = url;
        }
        return { index: i + 1, url, domain };
      }),
    [links]
  );

  const columns = useMemo<ColumnDef<LinkEntry>[]>(
    () => [
      {
        accessorKey: "index",
        header: "#",
        size: 50,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {String(getValue<number>()).padStart(3, "0")}
          </span>
        ),
      },
      {
        accessorKey: "domain",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-primary/80 hover:text-primary transition-colors"
            onClick={() => column.toggleSorting()}
          >
            Domena <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-foreground font-mono text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "url",
        header: "URL",
        cell: ({ getValue }) => (
          <a
            href={getValue<string>()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary/70 hover:text-primary font-mono text-xs truncate max-w-[400px] transition-colors"
          >
            {getValue<string>()}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-primary font-mono text-xs uppercase tracking-wider">
          Linki ({data.length})
        </span>
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Filtruj linki..."
          className="px-3 py-1.5 rounded-md bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none focus:border-primary/50 w-48"
        />
      </div>
      <div className="glass rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2 text-left font-mono text-xs uppercase text-primary/60">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  className="border-t border-border/30 hover:bg-primary/5 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-1.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LinksTable;
