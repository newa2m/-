export interface ParsedImportItem {
  id: string;
  name: string;
  value: number;
  unit: string;
  price?: number;
  category?: string;
  color?: string;
  notes?: string;
  selected: boolean;
}

export interface ParseResult {
  items: ParsedImportItem[];
  totalLines: number;
  detectedFormat: 'csv' | 'tsv' | 'lines' | 'empty';
  hasHeader: boolean;
  warnings: string[];
}

/**
 * Splits a CSV/TSV line considering quotes
 */
function splitRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Detects the most appropriate delimiter (, or ; or \t)
 */
function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 5).join('\n');
  const tabs = (sample.match(/\t/g) || []).length;
  const semicolons = (sample.match(/;/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;

  if (tabs > commas && tabs > semicolons) return '\t';
  if (semicolons > commas) return ';';
  if (commas > 0) return ',';
  return ',';
}

/**
 * Checks if line is a header row
 */
function isHeaderRow(cells: string[]): boolean {
  if (cells.length === 0) return false;
  const joined = cells.join(' ').toLowerCase();
  const headerKeywords = [
    'اسم', 'صنف', 'بند', 'مادة', 'name', 'item', 'title',
    'كمية', 'عدد', 'رصيد', 'qty', 'quantity', 'count', 'value',
    'وحدة', 'unit', 'تصنيف', 'فئة', 'category', 'ملاحظات', 'notes'
  ];
  return headerKeywords.some(kw => joined.includes(kw));
}

/**
 * Map header columns to indices
 */
function mapHeaderColumns(headerCells: string[]) {
  const map: {
    nameIndex: number;
    valueIndex: number;
    unitIndex: number;
    priceIndex: number;
    categoryIndex: number;
    notesIndex: number;
  } = {
    nameIndex: -1,
    valueIndex: -1,
    unitIndex: -1,
    priceIndex: -1,
    categoryIndex: -1,
    notesIndex: -1,
  };

  headerCells.forEach((cell, idx) => {
    const clean = cell.toLowerCase().trim();
    if (map.nameIndex === -1 && (clean.includes('اسم') || clean.includes('صنف') || clean.includes('بند') || clean.includes('name') || clean.includes('item'))) {
      map.nameIndex = idx;
    } else if (map.valueIndex === -1 && (clean.includes('كمية') || clean.includes('عدد') || clean.includes('رصيد') || clean.includes('qty') || clean.includes('count') || clean.includes('value'))) {
      map.valueIndex = idx;
    } else if (map.unitIndex === -1 && (clean.includes('وحدة') || clean.includes('unit'))) {
      map.unitIndex = idx;
    } else if (map.priceIndex === -1 && (clean.includes('سعر') || clean.includes('ثمن') || clean.includes('price') || clean.includes('cost') || clean.includes('rate'))) {
      map.priceIndex = idx;
    } else if (map.categoryIndex === -1 && (clean.includes('تصنيف') || clean.includes('فئة') || clean.includes('category'))) {
      map.categoryIndex = idx;
    } else if (map.notesIndex === -1 && (clean.includes('ملاحظ') || clean.includes('وصف') || clean.includes('notes') || clean.includes('desc'))) {
      map.notesIndex = idx;
    }
  });

  // Fallbacks if not recognized by keyword
  if (map.nameIndex === -1) map.nameIndex = 0;
  if (map.valueIndex === -1 && headerCells.length > 1) map.valueIndex = 1;
  if (map.unitIndex === -1 && headerCells.length > 2) map.unitIndex = 2;
  if (map.categoryIndex === -1 && headerCells.length > 3) map.categoryIndex = 3;
  if (map.notesIndex === -1 && headerCells.length > 4) map.notesIndex = 4;

  return map;
}

/**
 * Extracts quantity and optional unit from end of freeform string
 * e.g. "محبس نحاس (12)" or "خلاط مياه 5 قطع" or "مواسير 4 بوصة - 20"
 */
function extractQuantityAndUnitFromFreeText(text: string): { name: string; quantity: number | null; unit?: string } {
  let cleaned = text.trim();
  
  // 1. Matches "اسم البند (12)" or "اسم البند [12]"
  const parenMatch = cleaned.match(/^(.*?)[([（](\d+(?:\.\d+)?)\s*([\p{L}\w]*)[)\]）]$/u);
  if (parenMatch) {
    return {
      name: parenMatch[1].trim(),
      quantity: parseFloat(parenMatch[2]),
      unit: parenMatch[3].trim() || undefined,
    };
  }

  // 2. Matches "اسم البند - 12 قطعة" or "اسم البند : 12 قطعة"
  const dashMatch = cleaned.match(/^(.*?)\s*[-:—–]\s*(\d+(?:\.\d+)?)\s*([\p{L}\w]*)$/u);
  if (dashMatch) {
    return {
      name: dashMatch[1].trim(),
      quantity: parseFloat(dashMatch[2]),
      unit: dashMatch[3].trim() || undefined,
    };
  }

  // 3. Matches "اسم البند 12 حبة" if ends with number and unit
  const endNumMatch = cleaned.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s+([\p{L}\w]+)$/u);
  if (endNumMatch) {
    // Only if the name part is not just an empty string
    if (endNumMatch[1].trim().length > 1) {
      return {
        name: endNumMatch[1].trim(),
        quantity: parseFloat(endNumMatch[2]),
        unit: endNumMatch[3].trim(),
      };
    }
  }

  return { name: cleaned, quantity: null };
}

/**
 * Main parser function to import text or CSV into items
 */
export function parseImportText(
  rawText: string,
  defaultQuantity: number = 0,
  defaultUnitFallback: string = 'قطعة'
): ParseResult {
  const result: ParseResult = {
    items: [],
    totalLines: 0,
    detectedFormat: 'empty',
    hasHeader: false,
    warnings: [],
  };

  if (!rawText || !rawText.trim()) {
    return result;
  }

  // Split lines, ignoring completely empty lines
  const rawLines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  result.totalLines = rawLines.length;
  if (rawLines.length === 0) return result;

  const delimiter = detectDelimiter(rawLines);
  const firstLineCells = splitRow(rawLines[0], delimiter);
  const hasMultipleColumns = firstLineCells.length > 1;

  result.hasHeader = isHeaderRow(firstLineCells);
  result.detectedFormat = delimiter === '\t' ? 'tsv' : hasMultipleColumns ? 'csv' : 'lines';

  let startLineIndex = 0;
  let columnMap = {
    nameIndex: 0,
    valueIndex: 1,
    unitIndex: 2,
    priceIndex: -1,
    categoryIndex: 3,
    notesIndex: 4,
  };

  if (result.hasHeader && hasMultipleColumns) {
    columnMap = mapHeaderColumns(firstLineCells);
    startLineIndex = 1;
  }

  for (let i = startLineIndex; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line) continue;

    let name = '';
    let value = defaultQuantity;
    let unit = defaultUnitFallback;
    let price: number | undefined = undefined;
    let category: string | undefined = undefined;
    let color: string | undefined = undefined;
    let notes: string | undefined = undefined;

    if (hasMultipleColumns) {
      const cells = splitRow(line, delimiter);
      name = (cells[columnMap.nameIndex] || '').trim();

      if (columnMap.valueIndex >= 0 && cells[columnMap.valueIndex] !== undefined) {
        const parsedVal = parseFloat(cells[columnMap.valueIndex]);
        if (!isNaN(parsedVal)) {
          value = parsedVal;
        }
      }

      if (columnMap.unitIndex >= 0 && cells[columnMap.unitIndex]) {
        unit = cells[columnMap.unitIndex].trim();
      }

      if (columnMap.priceIndex >= 0 && cells[columnMap.priceIndex] !== undefined) {
        const parsedPrice = parseFloat(cells[columnMap.priceIndex]);
        if (!isNaN(parsedPrice) && parsedPrice >= 0) {
          price = parsedPrice;
        }
      }

      if (columnMap.categoryIndex >= 0 && cells[columnMap.categoryIndex]) {
        category = cells[columnMap.categoryIndex].trim();
      }

      if (columnMap.notesIndex >= 0 && cells[columnMap.notesIndex]) {
        notes = cells[columnMap.notesIndex].trim();
      }
    } else {
      // Freeform single line parsing
      // Check if line contains a bullet point or numbering like "1. محبس" or "- محبس"
      let cleanLine = line.replace(/^[\d+.)\-*•#]+\s*/, '').trim();
      const extracted = extractQuantityAndUnitFromFreeText(cleanLine);
      name = extracted.name;
      if (extracted.quantity !== null) {
        value = extracted.quantity;
      }
      if (extracted.unit) {
        unit = extracted.unit;
      }
    }

    if (!name) continue;

    result.items.push({
      id: `preview-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      value,
      unit: unit || 'قطعة',
      price,
      color: color || 'emerald',
      notes,
      selected: true,
    });
  }

  return result;
}

/**
 * Built-in ready-to-use sample lists
 */
export const SAMPLE_IMPORT_LISTS = [
  {
    id: 'plumbing',
    label: 'قائمة سباكة وتغذية وصرف (CSV)',
    data: `اسم الصنف, الكمية, الوحدة, التصنيف, ملاحظات
محبس دفن تركي 1 بوصة, 15, حبة, سباكة, ماركة جروهي
ماسورة بي في سي 2 بوصة رمادي, 35, متر, سباكة, مواسير صرف
كوع زاوية 90 درجة 1 بوصة, 50, قطعة, سباكة, بولي بروبلين
سيفون معلق ضاغط مزدوج, 8, طقم, سباكة, حمامات الضيوف
خلاط مغسلة شجرة نيكل كروم, 12, حبة, سباكة, مع ليات التغذية
شريط تفلون مانع للتسريب, 40, بكرة, سباكة, عريض
محبس زاوية نص بوصة, 30, حبة, سباكة, إيطالي اصلي
بانيو قدم أكريليك 80x80, 4, حبة, سباكة, مستودع B
شطاف مرحاض بخرطوم مرن, 20, طقم, سباكة, كروم ضد الصدأ`,
  },
  {
    id: 'electrical',
    label: 'قائمة كهرباء وإنارة (CSV)',
    data: `اسم الصنف, الكمية, الوحدة, التصنيف, ملاحظات
سلك نحاس معزول 2.5 ملم, 10, لفة, كهرباء, أحمر وأزرق
قاطع كهربائي أوتوماتيك 32 أمبير, 24, حبة, كهرباء, شنايدر
مفتاح إنارة مفرد ليد, 60, حبة, كهرباء, ساس أبيض
بريزة ثلاثية مع مفتاح, 45, حبة, كهرباء, مع تأريض
لمبة سبوت لايت 7 واط وورم, 120, حبة, كهرباء, إضاءة دافئة
خرطوم كهرباء مرن 16 ملم, 15, لفة, كهرباء, مجرور خرسانة
شريط لحام شكرتون ملون, 50, بكرة, كهرباء, أصلي
كشاف ليد خارجي 50 واط, 8, حبة, كهرباء, مقاوم للماء IP65`,
  },
  {
    id: 'simple-lines',
    label: 'نص عادي (كل سطر بند مع عدده)',
    data: `محبس بلي 1 بوصة (20)
ماسورة صرف 4 بوصة - 15 متر
سيفون جداري 6 قطع
خلاط دش 10
شريط تفلون 50 بكرة
قفيز حديد 2 بوصة
طبة تسليك 3 بوصة (8)
وصلة نيكل 60 سم - 25 قطعة`,
  }
];
