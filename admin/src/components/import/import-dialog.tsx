"use client";

import { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { readSheet, downloadTemplate, type SheetRow } from "@/lib/excel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PreviewColumn {
  header: string;
  cell: (row: any) => React.ReactNode;
  className?: string;
}

export interface ImportConfig<Payload> {
  title: string;
  description: string;
  /** Server endpoint that accepts `{ rows, dryRun, ...extra }`. */
  endpoint: string;
  template: { filename: string; headers: string[]; examples: (string | number)[][] };
  /** Turn one spreadsheet row into the API row shape. */
  mapRow: (row: SheetRow) => Payload;
  /** Columns shown in the preview, fed by the server's dry-run `rows`. */
  columns: PreviewColumn[];
  /** Whether a dry-run row is an error (red) / a no-op (muted). */
  isError: (row: any) => boolean;
  isNoop?: (row: any) => boolean;
  /** Chips summarising the dry run, e.g. "12 to create". */
  summary: (result: any) => { label: string; tone?: "default" | "muted" | "error" }[];
  /** Extra request fields, e.g. `{ mode: "set" }`. */
  extra?: Record<string, unknown>;
  /** Controls rendered above the drop zone (e.g. import mode). Changing them re-runs the preview. */
  options?: React.ReactNode;
  applyLabel?: (result: any) => string;
}

type Step = "pick" | "checking" | "preview" | "applying";

export function ImportDialog<Payload>({
  open,
  onOpenChange,
  config,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ImportConfig<Payload>;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("pick");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Payload[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [dragging, setDragging] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);

  const reset = () => {
    setStep("pick");
    setFileName("");
    setRows([]);
    setResult(null);
    setOnlyErrors(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = (v: boolean) => {
    if (step === "applying") return;
    if (!v) reset();
    onOpenChange(v);
  };

  const check = async (payload: Payload[]) => {
    setStep("checking");
    try {
      const res = await api.post(config.endpoint, { ...config.extra, rows: payload, dryRun: true });
      setResult(res.data);
      setOnlyErrors(false);
      setStep("preview");
    } catch (err) {
      toast.error(apiError(err, "Could not check the file"));
      setStep("pick");
    }
  };

  // Options such as the import mode change the outcome, so re-check the same file.
  const extraKey = JSON.stringify(config.extra ?? {});
  useEffect(() => {
    if (rows.length && step === "preview") check(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraKey]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      toast.error("Choose an Excel (.xlsx, .xls) or CSV file.");
      return;
    }
    setFileName(file.name);
    try {
      const sheet = await readSheet(file);
      if (!sheet.rows.length) {
        toast.error("That sheet has no rows under the header.");
        return;
      }
      const mapped = sheet.rows.map(config.mapRow);
      setRows(mapped);
      await check(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't read that file. Is it a valid spreadsheet?");
      setStep("pick");
    }
  };

  const apply = async () => {
    setStep("applying");
    try {
      await api.post(config.endpoint, { ...config.extra, rows, dryRun: false });
      toast.success("Import complete");
      onDone();
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err, "Import failed; nothing was changed"));
      setStep("preview");
    }
  };

  const previewRows: any[] = result?.rows ?? [];
  const errorCount = previewRows.filter(config.isError).length;
  const shown = onlyErrors ? previewRows.filter(config.isError) : previewRows;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        {config.options && step !== "applying" && (
          <div className="flex flex-wrap items-center gap-3">{config.options}</div>
        )}

        {step === "pick" || step === "checking" ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              disabled={step === "checking"}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-12 text-center transition",
                dragging ? "border-accent bg-accent/10" : "border-border hover:border-accent hover:bg-muted/40"
              )}
            >
              {step === "checking" ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <span className="text-sm font-medium">Checking {fileName}…</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-accent" />
                  <span className="text-sm font-medium">Drop an Excel or CSV file, or click to choose</span>
                  <span className="text-xs text-muted-foreground">
                    Nothing is saved until you review the preview and confirm.
                  </span>
                </>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">
                Columns: <span className="text-foreground">{config.template.headers.join(", ")}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() =>
                  downloadTemplate(config.template.filename, config.template.headers, config.template.examples)
                }
              >
                <Download className="h-4 w-4 mr-1.5" /> Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-accent" />
              <span className="font-medium truncate max-w-[16rem]">{fileName}</span>
              <span className="text-muted-foreground">· {previewRows.length} rows</span>
              <span className="flex-1" />
              {config.summary(result).map((s) => (
                <Badge
                  key={s.label}
                  variant={s.tone === "error" ? "destructive" : s.tone === "muted" ? "outline" : "secondary"}
                >
                  {s.label}
                </Badge>
              ))}
            </div>

            {errorCount > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Fix {errorCount} row{errorCount === 1 ? "" : "s"} in your file and upload it again.
                </span>
                <Button variant="ghost" size="sm" onClick={() => setOnlyErrors((v) => !v)}>
                  {onlyErrors ? "Show all" : "Show errors only"}
                </Button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium w-14">Row</th>
                    {config.columns.map((c) => (
                      <th key={c.header} className={cn("px-3 py-2 text-left font-medium", c.className)}>
                        {c.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r, i) => {
                    const error = config.isError(r);
                    const noop = config.isNoop?.(r);
                    return (
                      <tr
                        key={`${r.line}-${i}`}
                        className={cn(
                          "border-t align-top",
                          error && "bg-destructive/5",
                          noop && "text-muted-foreground"
                        )}
                      >
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">{r.line}</td>
                        {config.columns.map((c) => (
                          <td key={c.header} className={cn("px-3 py-2", c.className)}>
                            {c.cell(r)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step === "preview" || step === "applying" ? (
            <>
              <Button variant="outline" onClick={reset} disabled={step === "applying"}>
                Choose another file
              </Button>
              <Button onClick={apply} disabled={errorCount > 0 || step === "applying"}>
                {step === "applying" ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                )}
                {config.applyLabel?.(result) ?? "Import"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Status cell used by every preview: red message for errors, otherwise a label. */
export function RowStatus({ error, label, message }: { error?: boolean; label: string; message?: string | null }) {
  return error ? (
    <span className="flex items-start gap-1.5 text-destructive">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      {message}
    </span>
  ) : (
    <span>{label}</span>
  );
}
