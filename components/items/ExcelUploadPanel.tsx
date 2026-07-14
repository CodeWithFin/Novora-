'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBatchCreateItems } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  parseProductRows,
  type ParsedProductRow,
} from '@/lib/utils/parseProductSheet';
import { cn } from '@/lib/utils/cn';

const FORMAT_LABELS = {
  makeup: 'Makeup sheet (brand + description + item code)',
  skincare: 'Skincare sheet (brand + description + size + expiry)',
  standard: 'Standard product columns',
  unknown: 'Unknown layout',
} as const;

function downloadTemplate() {
  const rows = [
    {
      'Name Of Product': 'Anua',
      Description: 'Niacinamide 10% + Txa 4% Serum',
      'Amount In ml or G': '30ml',
      'Total Pieces': 162,
      'Expiry Date': '2027-05-01',
      Category: 'Skincare',
    },
    {
      'Name Of Product': 'La Girl',
      Description: 'Pro Matte Nutmeg',
      'Item code': 'GLM683',
      'Total Pieces': 93,
      Category: 'Makeup',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, 'novora-product-import-template.xlsx');
}

export function ExcelUploadPanel() {
  const router = useRouter();
  const { isViewer } = useAuth();
  const batchCreate = useBatchCreateItems();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedProductRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const [defaultCategory, setDefaultCategory] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);

  const clear = () => {
    setFileName(null);
    setRows([]);
    setParseErrors([]);
    setDetectedFormat(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const parseFile = useCallback(
    async (file: File, categoryOverride?: string) => {
      setParsing(true);
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {
          type: 'array',
          cellDates: true,
        });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          toast.error('Workbook has no sheets');
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet,
          { defval: '', raw: true }
        );

        const result = parseProductRows(rawRows, {
          defaultCategory: categoryOverride ?? defaultCategory,
        });

        setFileName(file.name);
        setRows(result.rows);
        setParseErrors(result.errors);
        setDetectedFormat(result.detectedFormat);

        if (result.rows.length === 0) {
          toast.error(result.errors[0] ?? 'No products found in file');
        } else {
          toast.success(
            `Found ${result.rows.length} product${result.rows.length === 1 ? '' : 's'}`
          );
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Could not read spreadsheet'
        );
        clear();
      } finally {
        setParsing(false);
      }
    },
    [defaultCategory]
  );

  const onFile = (file: File | undefined | null) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls') && !lower.endsWith('.csv')) {
      toast.error('Upload an Excel (.xlsx / .xls) or CSV file');
      return;
    }
    void parseFile(file);
  };

  const handleImport = async () => {
    if (isViewer || rows.length === 0) return;

    try {
      const result = await batchCreate.mutateAsync(
        rows.map((r) => ({
          name: r.name,
          sku: r.sku,
          barcode: r.barcode,
          category: r.category || defaultCategory.trim() || null,
          unit: r.unit,
          minStock: r.minStock || 10,
          quantity: r.quantity,
          expiryDate: r.expiryDate,
        }))
      );

      const parts = [
        `${result.created} added`,
        result.skipped ? `${result.skipped} already existed` : null,
        result.stocked ? `${result.stocked} stocked in` : null,
      ].filter(Boolean);

      toast.success(parts.join(' · '));
      router.push('/items');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const withQty = rows.filter((r) => r.quantity != null && r.quantity > 0).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="default-category">Default category (optional)</Label>
          <Input
            id="default-category"
            list="upload-categories"
            placeholder="e.g. Makeup or Skincare"
            value={defaultCategory}
            onChange={(e) => setDefaultCategory(e.target.value)}
            disabled={isViewer}
            className="w-56"
          />
          <p className="text-xs text-foreground-muted">
            Used when the sheet has no Category column.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={downloadTemplate}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Download template
        </Button>
      </div>

      <datalist id="upload-categories">
        <option value="Makeup" />
        <option value="Skincare" />
      </datalist>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border-default bg-raised/40'
        )}
      >
        <Upload className="h-8 w-8 text-foreground-muted" />
        <div>
          <p className="font-medium text-foreground-primary">
            Drop your Excel sheet here
          </p>
          <p className="mt-1 max-w-md text-sm text-foreground-secondary">
            Works with your makeup sheets (item code + pieces) and skincare
            sheets (size + pieces + expiry).
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          className="hidden"
          disabled={isViewer || parsing}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isViewer || parsing}
          onClick={() => inputRef.current?.click()}
        >
          {parsing ? 'Reading…' : 'Choose file'}
        </Button>
      </div>

      {fileName && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{fileName}</p>
            {detectedFormat && (
              <p className="text-xs text-foreground-muted">
                Detected:{' '}
                {FORMAT_LABELS[detectedFormat as keyof typeof FORMAT_LABELS] ??
                  detectedFormat}
              </p>
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={clear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {parseErrors.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {parseErrors.slice(0, 8).map((err) => (
            <li key={err}>{err}</li>
          ))}
          {parseErrors.length > 8 && (
            <li>…and {parseErrors.length - 8} more</li>
          )}
        </ul>
      )}

      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((row) => (
                  <TableRow key={`${row.rowNumber}-${row.name}`}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {row.sku ?? '—'}
                    </TableCell>
                    <TableCell>
                      {row.category || defaultCategory || '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.quantity ?? '—'}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.expiryDate ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length > 50 && (
            <p className="text-sm text-foreground-muted">
              Showing first 50 of {rows.length} rows.
            </p>
          )}

          {!isViewer && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-foreground-secondary">
                {rows.length} products
                {withQty > 0 ? ` · ${withQty} with stock to bring in` : ''}
              </p>
              <Button onClick={handleImport} disabled={batchCreate.isPending}>
                {batchCreate.isPending
                  ? `Importing ${rows.length} products…`
                  : `Import ${rows.length} products`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
