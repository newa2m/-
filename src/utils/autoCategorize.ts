/**
 * Smart Auto-Categorization Utility for Arabic Inventory Items
 * Automatically classifies items into appropriate categories and colors
 * based on recognized keywords, prefixes, and stems in the item name.
 */

export interface CategoryRule {
  category: string;
  color: string;
  defaultUnit?: string;
  keywords: string[];
}

export const AUTO_CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'سباكة',
    color: 'blue',
    defaultUnit: 'قطعة',
    keywords: [
      'ماسورة', 'مواسير', 'بولي', 'كوع', 'تيه', 'تي', 'جلبة', 'محبس', 'محابس',
      'سيفون', 'خلاط', 'دش', 'حنفية', 'صنبور', 'حوض', 'قاعدة', 'بيبة', 'صرف',
      'تغذية', 'نبل', 'بوش', 'كرنك', 'تفلون', 'شطاف', 'سخان', 'بانيو', 'مرحاض',
      'قفيز', 'بالوعة', 'pvc', 'ppr', 'فلتر', 'سدادة', 'خرطوم مياه', 'محبس زاوية',
      'شطافة', 'عوامة', 'شيك بلف', 'رداد', 'مقلب', 'وصلة نيكل', 'سباكة'
    ]
  },
  {
    category: 'كهرباء',
    color: 'amber',
    defaultUnit: 'قطعة',
    keywords: [
      'سلك', 'اسلاك', 'أسلاك', 'كابل', 'كوابل', 'كبل', 'مفتاح كهرباء', 'بريزة',
      'فيشة', 'قاطع', 'لقمة', 'لمبة', 'سبوت', 'ليد', 'نجفة', 'شاسيه', 'خرطوم كهرباء',
      'بواط', 'لوحة توزيع', 'طبلون', 'فيوز', 'شريط لحام', 'شكرتون', 'ترنس', 'كشاف',
      'دواية', 'كونتاكتور', 'اوفرلود', 'بوش بوتون', 'روزتة', 'فيشة نتاية', 'فيشة دكر',
      'كهرباء', 'انارة', 'إنارة', 'طاقة', 'توصيلة'
    ]
  },
  {
    category: 'دهانات ونقاشة',
    color: 'purple',
    defaultUnit: 'علبة',
    keywords: [
      'دهان', 'دهانات', 'بوية', 'بويا', 'معجون', 'سكينة معجون', 'رولة', 'رول',
      'فرشة', 'فرشاة', 'سيلر', 'صنفرة', 'بلاستيك', 'لاكيه', 'تنر', 'ثنر', 'ورنيش',
      'بطانة', 'قطيفة', 'جوتن', 'كابسي', 'سايبس', 'صبغة', 'معجون حوائط', 'سقف',
      'الوان', 'ألوان', 'ديكور', 'ستوكو', 'سيبيداج', 'زنك'
    ]
  },
  {
    category: 'نجارة وأخشاب',
    color: 'orange',
    defaultUnit: 'لوح',
    keywords: [
      'باب', 'ابواب', 'أبواب', 'شباك', 'شبابيك', 'خشب', 'اخشاب', 'أخشاب',
      'مسمار', 'مسامير', 'مفصلة', 'مفصلات', 'كالون', 'كوالين', 'اوكرة', 'أوكرة',
      'مقبض', 'مقابض', 'زاوية خشب', 'رف', 'ارفف', 'أرفف', 'mdf', 'ابلكاش', 'سويد',
      'زان', 'موسكي', 'كونتر', 'غراء خشب', 'برور', 'كبس', 'قشرة', 'باركية',
      'مفصلات مطبخ', 'سكة درج', 'نجارة'
    ]
  },
  {
    category: 'مواد بناء وخرسانة',
    color: 'slate',
    defaultUnit: 'شيكارة',
    keywords: [
      'اسمنت', 'أسمنت', 'رمل', 'رملة', 'سن', 'طوب', 'جبس', 'خرسانة',
      'حديد تسليح', 'كانات', 'سلك رباط', 'شيكارة', 'زلط', 'مونة', 'جير',
      'اديبوند', 'أديبوند', 'عزل اسمنتي', 'بلك', 'طوب اسمنتي', 'طوب احمر',
      'طوب طفلي', 'سيكاتوب', 'بناء'
    ]
  },
  {
    category: 'سيراميك وتشطيبات',
    color: 'cyan',
    defaultUnit: 'متر مربع',
    keywords: [
      'سيراميك', 'بورسلين', 'رخام', 'جرانيت', 'بلاط', 'غراء بلاط', 'صليبة',
      'صلايب', 'روبة', 'وزرة', 'فواصل بلاط', 'سيراميكا', 'تشطيبات'
    ]
  },
  {
    category: 'أدوات ومعدات',
    color: 'emerald',
    defaultUnit: 'عدد',
    keywords: [
      'شنيور', 'دريل', 'صاروخ', 'ميزان مياه', 'ميزان ليزر', 'متر قياس', 'شاكوش',
      'مطرقة', 'اجنة', 'أجنة', 'بنسة', 'مفك', 'مفكات', 'زردية', 'منشار', 'سلم',
      'قروانة', 'مالج', 'مسطرين', 'كوريك', 'عربة يد', 'كماشة', 'مفتاح انجليزي',
      'مفتاح فرنساوي', 'مبرد', 'عدة', 'ادوات', 'أدوات'
    ]
  },
  {
    category: 'تكييف وتهوية',
    color: 'indigo',
    defaultUnit: 'جهاز',
    keywords: [
      'تكييف', 'مكيف', 'فريون', 'نحاس تكييف', 'دكت', 'مروحة', 'شفاط', 'شفاطات',
      'فلتر هواء', 'كونسيلد', 'سبليت', 'تبريد', 'تهوية'
    ]
  },
  {
    category: 'أمن وسلامة',
    color: 'rose',
    defaultUnit: 'قطعة',
    keywords: [
      'خوذة', 'قفاز', 'قفازات', 'جوانتي', 'نظارة واقية', 'حذاء سيفتي', 'سيفتي',
      'طفاية حريق', 'طفاية', 'كمامة', 'سترة فوسفورية', 'حزام امان', 'إسعافات'
    ]
  }
];

/**
 * Normalizes Arabic text for consistent fuzzy matching:
 * Removes tashkeel, standardizes alefs, taa marbuta, etc.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    // Remove diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alefs
    .replace(/[إأآا]/g, 'ا')
    // Normalize Taa Marbuta & Haa
    .replace(/ة/g, 'ه')
    // Normalize Yaa & Alef Maksura
    .replace(/ى/g, 'ي')
    // Remove common prefixes when followed by letters (الـ)
    .replace(/\s+/g, ' ');
}

export interface DetectedCategory {
  category: string;
  color: string;
  matchedKeyword: string;
  defaultUnit?: string;
}

/**
 * Detects the category of an item name based on predefined keyword rules.
 * Supports exact matching, word boundaries, and prefix stripping.
 */
export function detectCategoryFromName(itemName: string): DetectedCategory | null {
  if (!itemName || !itemName.trim()) return null;

  const normalizedInput = normalizeArabic(itemName);
  const words = normalizedInput.split(/[\s,.\-_/\\()]+/);

  for (const rule of AUTO_CATEGORY_RULES) {
    for (const rawKw of rule.keywords) {
      const kw = normalizeArabic(rawKw);
      
      // 1. Check if the full normalized text contains the keyword as a phrase
      if (normalizedInput.includes(kw)) {
        return {
          category: rule.category,
          color: rule.color,
          matchedKeyword: rawKw,
          defaultUnit: rule.defaultUnit,
        };
      }

      // 2. Check each word with prefix stripping (like 'الـ' or 'وـ' or 'بـ')
      for (const word of words) {
        if (word === kw) {
          return {
            category: rule.category,
            color: rule.color,
            matchedKeyword: rawKw,
            defaultUnit: rule.defaultUnit,
          };
        }

        // Strip 'ال'
        if (word.startsWith('ال') && word.slice(2) === kw) {
          return {
            category: rule.category,
            color: rule.color,
            matchedKeyword: rawKw,
            defaultUnit: rule.defaultUnit,
          };
        }

        // Strip 'و'
        if (word.startsWith('و') && word.slice(1) === kw) {
          return {
            category: rule.category,
            color: rule.color,
            matchedKeyword: rawKw,
            defaultUnit: rule.defaultUnit,
          };
        }

        // Strip 'وال'
        if (word.startsWith('وال') && word.slice(3) === kw) {
          return {
            category: rule.category,
            color: rule.color,
            matchedKeyword: rawKw,
            defaultUnit: rule.defaultUnit,
          };
        }
      }
    }
  }

  return null;
}
