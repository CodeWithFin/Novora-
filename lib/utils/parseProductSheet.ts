export interface ParsedProductRow {
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  unit: string;
  price: number | null;
  minStock: number;
  quantity: number | null;
  expiryDate: string | null;
  /** Original sheet row number (1-based, including header) */
  rowNumber: number;
}

export interface ParseProductSheetResult {
  rows: ParsedProductRow[];
  errors: string[];
  detectedFormat: 'makeup' | 'skincare' | 'standard' | 'unknown';
}

type RawRow = Record<string, unknown>;

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function cellString(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function cellNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/,/g, '').trim();
  if (!cleaned || cleaned === '~~~' || cleaned === '-' || cleaned === '—') {
    return null;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parse expiry values like Excel dates, MM/YYYY, DD/MM/YYYY, YYYY-MM-DD */
export function parseExpiryDate(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // SheetJS Excel dates often land a few hours before midnight UTC for the
    // intended calendar day (e.g. May → Apr 30 20:59Z). Nudge noonward first.
    const nudged = new Date(value.getTime() + 12 * 60 * 60 * 1000);
    const y = nudged.getUTCFullYear();
    const m = String(nudged.getUTCMonth() + 1).padStart(2, '0');
    const d = String(nudged.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const raw = String(value).trim();
  if (!raw || raw === '~~~' || raw === '-' || raw === '—') return null;

  // Excel serial date (e.g. 45658)
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 20000 && serial < 80000) {
      const excelEpoch = Date.UTC(1899, 11, 30);
      const ms = excelEpoch + Math.floor(serial) * 86400000;
      const date = new Date(ms);
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // MM/YYYY or M/YYYY
  const my = raw.match(/^(\d{1,2})[\/\-.](\d{4})$/);
  if (my) {
    const month = Number(my[1]);
    const year = Number(my[2]);
    if (month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}-01`;
    }
  }

  // YYYY-MM-DD
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // DD/MM/YYYY or MM/DD/YYYY — prefer DD/MM when day > 12
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const a = Number(dmy[1]);
    const b = Number(dmy[2]);
    const year = Number(dmy[3]);
    let day: number;
    let month: number;
    if (a > 12) {
      day = a;
      month = b;
    } else if (b > 12) {
      month = a;
      day = b;
    } else {
      // Ambiguous — treat as DD/MM (common in store sheets)
      day = a;
      month = b;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}

function findColumn(
  headers: string[],
  matchers: (string | RegExp)[]
): string | null {
  for (const matcher of matchers) {
    const found = headers.find((h) =>
      typeof matcher === 'string' ? h === matcher || h.includes(matcher) : matcher.test(h)
    );
    if (found) return found;
  }
  return null;
}

function buildColumnMap(headers: string[]) {
  const brand = findColumn(headers, [
    'name of product',
    'product name',
    'brand',
    'name',
  ]);
  const description = findColumn(headers, ['description', 'product description']);
  const sku = findColumn(headers, [
    'item code',
    'sku',
    'product code',
    'code',
  ]);
  const barcode = findColumn(headers, ['barcode', 'ean', 'upc']);
  const size = findColumn(headers, [
    'amount in ml or g',
    'amount in ml or',
    'size',
    'amount',
    'volume',
    'ml',
  ]);
  const quantity = findColumn(headers, [
    'total pieces',
    'pieces',
    'quantity',
    'qty',
    'stock',
    'total qty',
  ]);
  const boxes = findColumn(headers, ['total boxes', 'boxes']);
  const expiry = findColumn(headers, [
    'expiry date',
    'expiry',
    'exp date',
    'exp',
  ]);
  const category = findColumn(headers, ['category']);
  const unit = findColumn(headers, ['unit']);
  const price = findColumn(headers, ['price', 'cost', 'rrp']);
  const minStock = findColumn(headers, ['min stock', 'minstock', 'reorder']);

  return {
    brand,
    description,
    sku,
    barcode,
    size,
    quantity,
    boxes,
    expiry,
    category,
    unit,
    price,
    minStock,
  };
}

function detectFormat(map: ReturnType<typeof buildColumnMap>): ParseProductSheetResult['detectedFormat'] {
  if (map.sku && map.brand && map.description) return 'makeup';
  if (map.size && map.brand && map.description) return 'skincare';
  if (map.brand) return 'standard';
  return 'unknown';
}

function getByHeader(row: RawRow, header: string | null): unknown {
  if (!header) return undefined;
  return row[header];
}

function buildProductName(parts: {
  brand: string;
  description: string;
  size: string;
}): string {
  return [parts.brand, parts.description, parts.size]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse rows from an Excel/CSV sheet object (header keys = original headers).
 * Accepts SheetJS `sheet_to_json` output with `defval: ''`.
 */
export function parseProductRows(
  rawRows: RawRow[],
  options?: { defaultCategory?: string | null }
): ParseProductSheetResult {
  const errors: string[] = [];
  if (rawRows.length === 0) {
    return { rows: [], errors: ['Sheet is empty'], detectedFormat: 'unknown' };
  }

  const originalHeaders = Object.keys(rawRows[0] ?? {});
  const normalizedToOriginal = new Map<string, string>();
  for (const h of originalHeaders) {
    const n = normalizeHeader(h);
    if (n) normalizedToOriginal.set(n, h);
  }

  const normalizedHeaders = [...normalizedToOriginal.keys()];
  if (normalizedHeaders.length === 0) {
    return {
      rows: [],
      errors: ['Could not read column headers'],
      detectedFormat: 'unknown',
    };
  }

  const map = buildColumnMap(normalizedHeaders);
  const detectedFormat = detectFormat(map);

  if (!map.brand && !map.description) {
    return {
      rows: [],
      errors: [
        'Could not find a product name column. Expected headers like "Name Of Product", "Description", or "Name".',
      ],
      detectedFormat: 'unknown',
    };
  }

  // Remap rows to normalized keys
  const rows: ParsedProductRow[] = [];
  const seenNames = new Set<string>();

  rawRows.forEach((raw, index) => {
    const byNorm: RawRow = {};
    for (const [norm, orig] of normalizedToOriginal) {
      byNorm[norm] = raw[orig];
    }

    const brand = cellString(getByHeader(byNorm, map.brand));
    const description = cellString(getByHeader(byNorm, map.description));
    const size = cellString(getByHeader(byNorm, map.size));
    const sku = cellString(getByHeader(byNorm, map.sku)) || null;
    const barcode = cellString(getByHeader(byNorm, map.barcode)) || null;
    const category =
      cellString(getByHeader(byNorm, map.category)) ||
      options?.defaultCategory?.trim() ||
      null;
    const unit = cellString(getByHeader(byNorm, map.unit)) || 'pcs';
    const price = cellNumber(getByHeader(byNorm, map.price));
    const minStock = cellNumber(getByHeader(byNorm, map.minStock)) ?? 10;
    let quantity = cellNumber(getByHeader(byNorm, map.quantity));
    if (quantity == null && map.boxes) {
      quantity = cellNumber(getByHeader(byNorm, map.boxes));
    }
    const expiryDate = parseExpiryDate(getByHeader(byNorm, map.expiry));

    const name = buildProductName({ brand, description, size });
    if (!name) return; // blank row

    const key = name.toLowerCase();
    if (seenNames.has(key) && !sku) {
      errors.push(`Row ${index + 2}: duplicate name "${name}" — kept first`);
      return;
    }
    seenNames.add(key);

    rows.push({
      name,
      sku,
      barcode,
      category,
      unit,
      price,
      minStock: Math.max(0, Math.floor(minStock)),
      quantity:
        quantity != null && quantity > 0 ? Math.floor(quantity) : null,
      expiryDate,
      rowNumber: index + 2,
    });
  });

  if (rows.length === 0 && errors.length === 0) {
    errors.push('No product rows found in the sheet');
  }

  return { rows, errors, detectedFormat };
}
