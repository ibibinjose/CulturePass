/**
 * CulturePass — Language Reference
 *
 * ISO 639-3 based language list for cultural identity selection.
 * Covers the major world languages with diaspora-relevant coverage.
 */

export interface Language {
  id: string;       // ISO 639-3
  name: string;
  nativeName?: string;
  iso1?: string;    // ISO 639-1 (2-letter), if exists
  family: string;
  speakers?: number; // approximate millions
}

export const LANGUAGES: Record<string, Language> = {
  // Indo-European — Indo-Iranian
  eng: { id: 'eng', name: 'English',        nativeName: 'English',      iso1: 'en', family: 'Indo-European',  speakers: 1500 },
  hin: { id: 'hin', name: 'Hindi',          nativeName: 'हिन्दी',        iso1: 'hi', family: 'Indo-European',  speakers: 600  },
  ben: { id: 'ben', name: 'Bengali',        nativeName: 'বাংলা',         iso1: 'bn', family: 'Indo-European',  speakers: 270  },
  pan: { id: 'pan', name: 'Punjabi',        nativeName: 'ਪੰਜਾਬੀ',        iso1: 'pa', family: 'Indo-European',  speakers: 125  },
  guj: { id: 'guj', name: 'Gujarati',       nativeName: 'ગુજરાતી',        iso1: 'gu', family: 'Indo-European',  speakers: 60   },
  mar: { id: 'mar', name: 'Marathi',        nativeName: 'मराठी',          iso1: 'mr', family: 'Indo-European',  speakers: 95   },
  urd: { id: 'urd', name: 'Urdu',           nativeName: 'اردو',           iso1: 'ur', family: 'Indo-European',  speakers: 230  },
  nep: { id: 'nep', name: 'Nepali',         nativeName: 'नेपाली',         iso1: 'ne', family: 'Indo-European',  speakers: 17   },
  sin: { id: 'sin', name: 'Sinhala',        nativeName: 'සිංහල',          iso1: 'si', family: 'Indo-European',  speakers: 17   },
  fas: { id: 'fas', name: 'Persian',        nativeName: 'فارسی',          iso1: 'fa', family: 'Indo-European',  speakers: 80   },
  pus: { id: 'pus', name: 'Pashto',         nativeName: 'پښتو',           iso1: 'ps', family: 'Indo-European',  speakers: 50   },
  kok: { id: 'kok', name: 'Konkani',        nativeName: 'कोंकणी',         iso1: 'kok',family: 'Indo-European',  speakers: 2    },
  kas: { id: 'kas', name: 'Kashmiri',       nativeName: 'कॉशुर',          iso1: 'ks', family: 'Indo-European',  speakers: 7    },
  mai: { id: 'mai', name: 'Maithili',       nativeName: 'मैथिली',         iso1: 'mai',family: 'Indo-European',  speakers: 34   },
  por: { id: 'por', name: 'Portuguese',     nativeName: 'Português',      iso1: 'pt', family: 'Indo-European',  speakers: 250  },
  spa: { id: 'spa', name: 'Spanish',        nativeName: 'Español',        iso1: 'es', family: 'Indo-European',  speakers: 500  },
  fra: { id: 'fra', name: 'French',         nativeName: 'Français',       iso1: 'fr', family: 'Indo-European',  speakers: 280  },
  deu: { id: 'deu', name: 'German',         nativeName: 'Deutsch',        iso1: 'de', family: 'Indo-European',  speakers: 130  },
  ita: { id: 'ita', name: 'Italian',        nativeName: 'Italiano',       iso1: 'it', family: 'Indo-European',  speakers: 65   },
  rus: { id: 'rus', name: 'Russian',        nativeName: 'Русский',        iso1: 'ru', family: 'Indo-European',  speakers: 260  },
  pol: { id: 'pol', name: 'Polish',         nativeName: 'Polski',         iso1: 'pl', family: 'Indo-European',  speakers: 45   },
  ukr: { id: 'ukr', name: 'Ukrainian',      nativeName: 'Українська',     iso1: 'uk', family: 'Indo-European',  speakers: 40   },
  ron: { id: 'ron', name: 'Romanian',       nativeName: 'Română',         iso1: 'ro', family: 'Indo-European',  speakers: 24   },
  srp: { id: 'srp', name: 'Serbian',        nativeName: 'Српски',         iso1: 'sr', family: 'Indo-European',  speakers: 12   },
  hrv: { id: 'hrv', name: 'Croatian',       nativeName: 'Hrvatski',       iso1: 'hr', family: 'Indo-European',  speakers: 7    },
  hun: { id: 'hun', name: 'Hungarian',      nativeName: 'Magyar',         iso1: 'hu', family: 'Indo-European',  speakers: 13   },
  ell: { id: 'ell', name: 'Greek',          nativeName: 'Ελληνικά',       iso1: 'el', family: 'Indo-European',  speakers: 13   },
  nld: { id: 'nld', name: 'Dutch',          nativeName: 'Nederlands',     iso1: 'nl', family: 'Indo-European',  speakers: 25   },
  swe: { id: 'swe', name: 'Swedish',        nativeName: 'Svenska',        iso1: 'sv', family: 'Indo-European',  speakers: 10   },
  nor: { id: 'nor', name: 'Norwegian',      nativeName: 'Norsk',          iso1: 'no', family: 'Indo-European',  speakers: 5    },
  fin: { id: 'fin', name: 'Finnish',        nativeName: 'Suomi',          iso1: 'fi', family: 'Uralic',          speakers: 5    },
  gle: { id: 'gle', name: 'Irish',          nativeName: 'Gaeilge',        iso1: 'ga', family: 'Indo-European',  speakers: 1    },
  wel: { id: 'wel', name: 'Welsh',          nativeName: 'Cymraeg',        iso1: 'cy', family: 'Indo-European',  speakers: 1    },
  cat: { id: 'cat', name: 'Catalan',        nativeName: 'Català',         iso1: 'ca', family: 'Indo-European',  speakers: 10   },
  kat: { id: 'kat', name: 'Georgian',       nativeName: 'ქართული',         iso1: 'ka', family: 'Kartvelian',     speakers: 4    },
  hye: { id: 'hye', name: 'Armenian',       nativeName: 'Հայերեն',        iso1: 'hy', family: 'Indo-European',  speakers: 7    },
  sqi: { id: 'sqi', name: 'Albanian',       nativeName: 'Shqip',          iso1: 'sq', family: 'Indo-European',  speakers: 7    },
  // Dravidian
  tam: { id: 'tam', name: 'Tamil',          nativeName: 'தமிழ்',          iso1: 'ta', family: 'Dravidian',      speakers: 85   },
  tel: { id: 'tel', name: 'Telugu',         nativeName: 'తెలుగు',          iso1: 'te', family: 'Dravidian',      speakers: 95   },
  kan: { id: 'kan', name: 'Kannada',        nativeName: 'ಕನ್ನಡ',           iso1: 'kn', family: 'Dravidian',      speakers: 60   },
  mal: { id: 'mal', name: 'Malayalam',      nativeName: 'മലയാളം',          iso1: 'ml', family: 'Dravidian',      speakers: 38   },
  // Sino-Tibetan
  cmn: { id: 'cmn', name: 'Mandarin',       nativeName: '普通话',           iso1: 'zh', family: 'Sino-Tibetan',  speakers: 1100 },
  yue: { id: 'yue', name: 'Cantonese',      nativeName: '廣東話',           iso1: undefined, family: 'Sino-Tibetan',  speakers: 85   },
  nan: { id: 'nan', name: 'Hokkien',        nativeName: '閩南語',           iso1: undefined, family: 'Sino-Tibetan',  speakers: 50   },
  hak: { id: 'hak', name: 'Hakka',          nativeName: '客家話',           iso1: undefined, family: 'Sino-Tibetan',  speakers: 47   },
  wuu: { id: 'wuu', name: 'Shanghainese',   nativeName: '上海话',           iso1: undefined, family: 'Sino-Tibetan',  speakers: 80   },
  bod: { id: 'bod', name: 'Tibetan',        nativeName: 'བོད་སྐད།',          iso1: 'bo', family: 'Sino-Tibetan',  speakers: 6    },
  // Japonic / Koreanic
  jpn: { id: 'jpn', name: 'Japanese',       nativeName: '日本語',           iso1: 'ja', family: 'Japonic',        speakers: 125  },
  kor: { id: 'kor', name: 'Korean',         nativeName: '한국어',           iso1: 'ko', family: 'Koreanic',       speakers: 80   },
  // Austronesian
  zsm: { id: 'zsm', name: 'Malay',          nativeName: 'Bahasa Melayu',   iso1: 'ms', family: 'Austronesian',  speakers: 290  },
  tgl: { id: 'tgl', name: 'Tagalog',        nativeName: 'Tagalog',         iso1: 'tl', family: 'Austronesian',  speakers: 28   },
  ceb: { id: 'ceb', name: 'Cebuano',        nativeName: 'Sinugbuanon',     iso1: undefined, family: 'Austronesian',  speakers: 24   },
  ilo: { id: 'ilo', name: 'Ilocano',        nativeName: 'Ilokano',         iso1: undefined, family: 'Austronesian',  speakers: 10   },
  jav: { id: 'jav', name: 'Javanese',       nativeName: 'ꦧꦱꦗꦮ',             iso1: 'jv', family: 'Austronesian',  speakers: 98   },
  sun: { id: 'sun', name: 'Sundanese',      nativeName: 'Basa Sunda',      iso1: 'su', family: 'Austronesian',  speakers: 42   },
  bug: { id: 'bug', name: 'Buginese',       nativeName: 'Basa Ugi',        iso1: undefined, family: 'Austronesian',  speakers: 5    },
  mri: { id: 'mri', name: 'Maori',          nativeName: 'Te Reo Māori',    iso1: 'mi', family: 'Austronesian',  speakers: 0.1  },
  smo: { id: 'smo', name: 'Samoan',         nativeName: 'Gagana Sāmoa',    iso1: 'sm', family: 'Austronesian',  speakers: 0.5  },
  ton: { id: 'ton', name: 'Tongan',         nativeName: 'Lea faka-Tonga',  iso1: 'to', family: 'Austronesian',  speakers: 0.1  },
  fij: { id: 'fij', name: 'Fijian',         nativeName: 'Na Vosa Vakaviti',iso1: 'fj', family: 'Austronesian',  speakers: 0.5  },
  // Austroasiatic
  vie: { id: 'vie', name: 'Vietnamese',     nativeName: 'Tiếng Việt',      iso1: 'vi', family: 'Austroasiatic', speakers: 95   },
  khm: { id: 'khm', name: 'Khmer',          nativeName: 'ភាសាខ្មែរ',         iso1: 'km', family: 'Austroasiatic', speakers: 16   },
  // Tai-Kadai
  tha: { id: 'tha', name: 'Thai',           nativeName: 'ภาษาไทย',           iso1: 'th', family: 'Tai-Kadai',    speakers: 70   },
  lao: { id: 'lao', name: 'Lao',            nativeName: 'ພາສາລາວ',           iso1: 'lo', family: 'Tai-Kadai',    speakers: 7    },
  // Turkic
  tur: { id: 'tur', name: 'Turkish',        nativeName: 'Türkçe',          iso1: 'tr', family: 'Turkic',         speakers: 85   },
  uig: { id: 'uig', name: 'Uyghur',         nativeName: 'ئۇيغۇرچە',          iso1: 'ug', family: 'Turkic',         speakers: 12   },
  // Afro-Asiatic
  ara: { id: 'ara', name: 'Arabic',         nativeName: 'العربية',           iso1: 'ar', family: 'Afro-Asiatic', speakers: 370  },
  amh: { id: 'amh', name: 'Amharic',        nativeName: 'አማርኛ',              iso1: 'am', family: 'Afro-Asiatic', speakers: 60   },
  som: { id: 'som', name: 'Somali',         nativeName: 'Soomaali',         iso1: 'so', family: 'Afro-Asiatic', speakers: 22   },
  hau: { id: 'hau', name: 'Hausa',          nativeName: 'Hausa',            iso1: 'ha', family: 'Afro-Asiatic', speakers: 70   },
  // Niger-Congo
  yor: { id: 'yor', name: 'Yoruba',         nativeName: 'Yorùbá',           iso1: 'yo', family: 'Niger-Congo',  speakers: 45   },
  ibo: { id: 'ibo', name: 'Igbo',           nativeName: 'Igbo',             iso1: 'ig', family: 'Niger-Congo',  speakers: 45   },
  zul: { id: 'zul', name: 'Zulu',           nativeName: 'isiZulu',          iso1: 'zu', family: 'Niger-Congo',  speakers: 14   },
  xho: { id: 'xho', name: 'Xhosa',          nativeName: 'isiXhosa',         iso1: 'xh', family: 'Niger-Congo',  speakers: 10   },
  swa: { id: 'swa', name: 'Swahili',        nativeName: 'Kiswahili',        iso1: 'sw', family: 'Niger-Congo',  speakers: 200  },
  wol: { id: 'wol', name: 'Wolof',          nativeName: 'Wolof',            iso1: 'wo', family: 'Niger-Congo',  speakers: 10   },
  ewe: { id: 'ewe', name: 'Ewe',            nativeName: 'Eʋegbe',           iso1: 'ee', family: 'Niger-Congo',  speakers: 7    },
  kik: { id: 'kik', name: 'Kikuyu',         nativeName: 'Gĩkũyũ',           iso1: 'ki', family: 'Niger-Congo',  speakers: 8    },
  twi: { id: 'twi', name: 'Twi',            nativeName: 'Twi',              iso1: 'tw', family: 'Niger-Congo',  speakers: 11   },
  orm: { id: 'orm', name: 'Oromo',          nativeName: 'Afaan Oromoo',     iso1: 'om', family: 'Afro-Asiatic', speakers: 45   },
  // Dravidian (further)
  asm: { id: 'asm', name: 'Assamese',       nativeName: 'অসমীয়া',            iso1: 'as', family: 'Indo-European', speakers: 15  },
  ori: { id: 'ori', name: 'Odia',           nativeName: 'ଓଡ଼ିଆ',             iso1: 'or', family: 'Indo-European', speakers: 38  },
  // Indigenous
  que: { id: 'que', name: 'Quechua',        nativeName: 'Runa Simi',        iso1: 'qu', family: 'Quechuan',      speakers: 10   },
  grn: { id: 'grn', name: 'Guarani',        nativeName: 'Avañeʼẽ',          iso1: 'gn', family: 'Tupi-Guarani',  speakers: 7    },
  // Mongolic
  mon: { id: 'mon', name: 'Mongolian',      nativeName: 'Монгол хэл',        iso1: 'mn', family: 'Mongolic',      speakers: 6    },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Search languages by name */
export function searchLanguages(query: string): Language[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return Object.values(LANGUAGES);
  return Object.values(LANGUAGES).filter(
    (l) =>
      l.name.toLowerCase().includes(needle) ||
      (l.nativeName ?? '').toLowerCase().includes(needle) ||
      l.id.toLowerCase().includes(needle),
  );
}

/** Get a language by id */
export function getLanguage(id: string): Language | undefined {
  return LANGUAGES[id];
}

/** Sorted list of all languages */
export const ALL_LANGUAGES = Object.values(LANGUAGES).sort((a, b) =>
  a.name.localeCompare(b.name),
);

/** Most common diaspora languages (shown as quick-picks) */
export const COMMON_LANGUAGES = [
  'eng', 'cmn', 'hin', 'ara', 'spa', 'por', 'fra', 'ben',
  'tam', 'tel', 'mal', 'pan', 'guj', 'mar', 'urd',
  'vie', 'tha', 'zsm', 'tgl', 'jav',
  'jpn', 'kor', 'rus', 'pol', 'ukr',
  'yor', 'ibo', 'hau', 'amh', 'som', 'swa', 'zul',
].map((id) => LANGUAGES[id]).filter(Boolean);
