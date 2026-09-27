/**
 * Voice Recognition & Arabic Speech Parser for hands-free field counting
 */

export interface ParsedVoiceCommand {
  rawText: string;
  action: 'add' | 'subtract' | 'set' | 'unknown';
  amount: number | null;
}

const ARABIC_WORD_NUMBERS: Record<string, number> = {
  'صفر': 0,
  'واحد': 1,
  'واحدة': 1,
  'اتنين': 2,
  'اثنين': 2,
  'تلاتة': 3,
  'ثلاثة': 4,
  'اربعة': 4,
  'أربعة': 4,
  'خمسة': 5,
  'ستة': 6,
  'سبعة': 7,
  'تمانية': 8,
  'ثمانية': 8,
  'تسعة': 9,
  'عشرة': 10,
  'حداشر': 11,
  'احد عشر': 11,
  'اتناشر': 12,
  'اثنا عشر': 12,
  'تلاتاشر': 13,
  'اربعتاشر': 14,
  'خمسطاشر': 15,
  'خمستاشر': 15,
  'ستاشر': 16,
  'سبعتاشر': 17,
  'تمانتاشر': 18,
  'تسعتاشر': 19,
  'عشرين': 20,
  'عشرون': 20,
  'خمسة وعشرين': 25,
  'ثلاثين': 30,
  'تلاتين': 30,
  'اربعين': 40,
  'خمسين': 50,
  'ستين': 60,
  'سبعين': 70,
  'تمانين': 80,
  'تسعين': 90,
  'مية': 100,
  'مائة': 100,
  'ميه': 100,
  'ميتين': 200,
  'خمسمية': 500,
  'ألف': 1000,
  'الف': 1000,
};

export function parseArabicVoiceCommand(text: string): ParsedVoiceCommand {
  const clean = text.trim().toLowerCase();
  
  let action: 'add' | 'subtract' | 'set' | 'unknown' = 'add'; // Default to add for fast counting
  
  if (clean.includes('طرح') || clean.includes('ناقص') || clean.includes('اخصم') || clean.includes('انقص') || clean.startsWith('-')) {
    action = 'subtract';
  } else if (clean.includes('خليه') || clean.includes('اجعل') || clean.includes('تعديل') || clean.includes('يساوي') || clean.includes('صفر')) {
    action = 'set';
  } else if (clean.includes('زائد') || clean.includes('ضيف') || clean.includes('اضف') || clean.includes('زود') || clean.startsWith('+')) {
    action = 'add';
  }

  // 1. Try to find raw western or arabic-indic digits (e.g. 5, 25, ٢٥)
  const arabicIndicDigits: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };

  const normalizedDigits = clean.replace(/[٠-٩]/g, d => arabicIndicDigits[d] || d);
  const digitMatch = normalizedDigits.match(/\d+(\.\d+)?/);
  
  if (digitMatch) {
    const num = parseFloat(digitMatch[0]);
    return {
      rawText: text,
      action,
      amount: num,
    };
  }

  // 2. Try matching spoken words
  for (const [word, val] of Object.entries(ARABIC_WORD_NUMBERS)) {
    if (clean.includes(word)) {
      return {
        rawText: text,
        action,
        amount: val,
      };
    }
  }

  return {
    rawText: text,
    action: 'unknown',
    amount: null,
  };
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}
