"use client";

import { useDeferredValue, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Send,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { LocalPagination } from "@/components/ui/local-pagination";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoutResult } from "../scoutSchemas";

type SortColumn = "name" | "type" | "email" | "phone" | "website" | "address";
type SortDirection = "asc" | "desc";

interface ScoutResultsTableProps {
  results: ScoutResult[];
  onApply?: (result: ScoutResult) => void;
}

export function ScoutResultsTable({ results, onApply }: ScoutResultsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>(null);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) =>
      [r.name, r.type, r.email, r.website, r.address, r.town]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [results, deferredSearch]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const aVal = String(a[sort.column] ?? "").toLowerCase();
      const bVal = String(b[sort.column] ?? "").toLowerCase();
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }, [filtered, sort]);

  const pageSize = 15;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage]
  );

  function toggleSort(column: SortColumn) {
    setSort((prev) => {
      if (prev?.column === column) {
        return prev.direction === "asc" ? { column, direction: "desc" } : null;
      }
      return { column, direction: "asc" };
    });
    setPage(1);
  }

  function sortIcon(column: SortColumn) {
    if (sort?.column !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/60" />;
    }
    return sort.direction === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-primary" />
    );
  }

  function downloadExport(format: "excel" | "csv") {
    const headers = ["Nom", "Type", "Email", "Téléphone", "Site web", "Adresse", "Ville", "Source email"];
    const data = sorted.map((r) => ({
      Nom: r.name,
      Type: r.type,
      Email: r.email ?? "",
      Téléphone: r.phone ?? "",
      "Site web": r.website ?? "",
      Adresse: r.address ?? "",
      Ville: r.town ?? "",
      "Source email": r.emailSource,
    }));

    const filename = `scout-resultats-${new Date().toISOString().slice(0, 10)}`;

    if (format === "excel") {
      // Create a real XLSX file using SheetJS
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Résultats");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      triggerDownload(blob, `${filename}.xlsx`);
    } else {
      // Create a proper CSV file with semicolon separator (compatible with Excel France)
      const csvRows = [
        headers.join(";"),
        ...data.map((row) =>
          Object.values(row)
            .map((value) => {
              const str = String(value);
              if (str.includes(";") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(";")
        ),
      ];
      const csvContent = csvRows.join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      triggerDownload(blob, `${filename}.csv`);
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Helper component pour afficher les détails dans un popover
  function ResultDetails({ result }: { result: ScoutResult }) {
    return (
      <div className="space-y-3 min-w-[200px]">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{result.type}</Badge>
        </div>
        {result.email && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
            <a href={`mailto:${result.email}`} className="flex items-center gap-2 text-primary hover:underline text-sm">
              <Mail className="h-3.5 w-3.5" />
              {result.email}
            </a>
          </div>
        )}
        {result.phone && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Téléphone</p>
            <a href={`tel:${result.phone}`} className="flex items-center gap-2 text-primary hover:underline text-sm">
              <Phone className="h-3.5 w-3.5" />
              {result.phone}
            </a>
          </div>
        )}
        {result.website && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Site web</p>
            <a href={result.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="truncate max-w-[180px]">{result.website.replace(/^https?:\/\//, "")}</span>
            </a>
          </div>
        )}
        {result.address && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Adresse</p>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {result.address}
            </div>
          </div>
        )}
        {result.town && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Ville</p>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {result.town}
            </div>
          </div>
        )}
        <Separator className="my-2" />
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Source</p>
          <Badge variant="outline" className="text-xs">
            {result.emailSource || "OpenStreetMap"}
          </Badge>
        </div>
        {onApply && (
          <div className="pt-2">
            <Button
              size="sm"
              className="w-full text-xs"
              onClick={() => onApply(result)}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Ajouter à mes candidatures
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <Empty className="min-h-40 rounded-xl border border-dashed">
            <EmptyHeader>
              <EmptyTitle>Aucun résultat.</EmptyTitle>
              <EmptyDescription>Lancez une recherche pour découvrir des entreprises.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Résultats ({sorted.length})</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:w-auto sm:flex-wrap sm:justify-end">
          {/* Filter input */}
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filtrer..."
            className="w-full sm:w-48"
          />
          {/* Export buttons */}
           <div className="flex gap-2 sm:w-auto">
             <Button type="button" variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => downloadExport("excel")}>
               <Download className="mr-1.5 h-3.5 w-3.5" />
               <span className="hidden sm:inline">Excel</span>
               <span className="sm:hidden">XLSX</span>
             </Button>
             <Button type="button" variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => downloadExport("csv")}>
               <Download className="mr-1.5 h-3.5 w-3.5" />
               <span className="hidden sm:inline">CSV</span>
               <span className="sm:hidden">CSV</span>
             </Button>
           </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop table - visible only on lg+ */}
        <div className="hidden lg:block w-full">
          <div className="overflow-x-auto rounded-xl border w-full">
            <Table className="table-fixed w-full min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%] cursor-pointer select-none" onClick={() => toggleSort("name")}>
                    <span className="inline-flex items-center">
                      Nom {sortIcon("name")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[12%] cursor-pointer select-none" onClick={() => toggleSort("type")}>
                    <span className="inline-flex items-center">
                      Type {sortIcon("type")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[18%] cursor-pointer select-none" onClick={() => toggleSort("email")}>
                    <span className="inline-flex items-center">
                      Email {sortIcon("email")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[12%] cursor-pointer select-none" onClick={() => toggleSort("phone")}>
                    <span className="inline-flex items-center">
                      Tél. {sortIcon("phone")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[12%] cursor-pointer select-none" onClick={() => toggleSort("website")}>
                    <span className="inline-flex items-center">
                      Site {sortIcon("website")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[16%] cursor-pointer select-none" onClick={() => toggleSort("address")}>
                    <span className="inline-flex items-center">
                      Adresse {sortIcon("address")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/50">
                    <TableCell className="truncate" title={r.name}>
                      <span className="font-medium">{r.name}</span>
                    </TableCell>
                    <TableCell className="truncate whitespace-nowrap" title={r.type}>
                      <Badge variant="secondary" className="text-xs">{r.type}</Badge>
                    </TableCell>
                    <TableCell className="truncate" title={r.email ?? undefined}>
                      {r.email ? (
                        <a href={`mailto:${r.email}`} className="text-primary hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{r.email}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="truncate whitespace-nowrap" title={r.phone ?? undefined}>
                      {r.phone || "—"}
                    </TableCell>
                    <TableCell className="truncate" title={r.website ?? undefined}>
                      {r.website ? (
                        <a href={r.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">Site</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="truncate" title={r.address ?? undefined}>
                      {r.address || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4" side="bottom" align="end">
                            <ResultDetails result={r} />
                          </PopoverContent>
                        </Popover>
                        {onApply && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Ajouter comme candidature"
                            onClick={() => onApply(r)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile cards - visible on lg and below */}
        <div className="flex flex-col gap-3 lg:hidden">
          {visible.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <CardContent className="p-3">
                {/* Header: Name + Type + Actions */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-semibold">{r.name}</h3>
                    <Badge variant="secondary" className="mt-1 text-xs">{r.type}</Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Voir détails"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" side="bottom" align="end">
                        <ResultDetails result={r} />
                      </PopoverContent>
                    </Popover>
                    {onApply && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Ajouter comme candidature"
                        onClick={() => onApply(r)}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                {(r.email || r.phone || r.website) && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {r.email && (
                      <a
                        href={`mailto:${r.email}`}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                        title={r.email}
                      >
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[120px]">{r.email}</span>
                      </a>
                    )}
                    {r.phone && (
                      <a
                        href={`tel:${r.phone}`}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                        title={r.phone}
                      >
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[80px]">{r.phone}</span>
                      </a>
                    )}
                    {r.website && (
                      <a
                        href={r.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                        title={r.website}
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[100px]">{r.website.replace(/^https?:\/\//, "")}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Address */}
                {(r.address || r.town) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {[r.address, r.town].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-4">
          <LocalPagination
            currentPage={safePage}
            pageCount={pageCount}
            totalCount={sorted.length}
            pageSize={pageSize}
            itemLabel="résultats"
            compact
            onPageChange={setPage}
          />
        </div>
      </CardContent>
    </Card>
  );
}
