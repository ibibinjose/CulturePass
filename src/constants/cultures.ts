/**
 * CulturePass — Cultural Taxonomy
 *
 * Hierarchical: Continent → Nationality → Culture
 * Powers cultural identity onboarding, discovery filters, and community grouping.
 */

export interface Culture {
  id: string;
  label: string;
  emoji: string;
  nationalityId: string;
  primaryLanguageId: string;
}

export interface Nationality {
  id: string;
  label: string;
  countryCode: string; // ISO 3166-1 alpha-3
  emoji: string;       // flag emoji
  regionId: string;
  cultureIds: string[];
}

export interface Region {
  id: string;
  label: string;
  continentId: string;
  nationalityIds: string[];
}

export interface Continent {
  id: string;
  label: string;
  regionIds: string[];
}

// ---------------------------------------------------------------------------
// Cultures — the leaf nodes of the taxonomy
// ---------------------------------------------------------------------------
export const CULTURES: Record<string, Culture> = {
  // India — South
  malayali:       { id: 'malayali',       label: 'Malayali',        emoji: '🌴', nationalityId: 'indian',     primaryLanguageId: 'mal' },
  tamil:          { id: 'tamil',          label: 'Tamil',           emoji: '🏛️', nationalityId: 'indian',     primaryLanguageId: 'tam' },
  telugu:         { id: 'telugu',         label: 'Telugu',          emoji: '🎭', nationalityId: 'indian',     primaryLanguageId: 'tel' },
  kannada:        { id: 'kannada',        label: 'Kannada',         emoji: '🏯', nationalityId: 'indian',     primaryLanguageId: 'kan' },
  tulu:           { id: 'tulu',           label: 'Tulu',            emoji: '🌊', nationalityId: 'indian',     primaryLanguageId: 'tcy' },
  konkani:        { id: 'konkani',        label: 'Konkani',         emoji: '🌺', nationalityId: 'indian',     primaryLanguageId: 'kok' },
  goan:           { id: 'goan',           label: 'Goan',            emoji: '🏖️', nationalityId: 'indian',     primaryLanguageId: 'kok' },
  // India — North & West
  punjabi:        { id: 'punjabi',        label: 'Punjabi',         emoji: '🌾', nationalityId: 'indian',     primaryLanguageId: 'pan' },
  gujarati:       { id: 'gujarati',       label: 'Gujarati',        emoji: '🪁', nationalityId: 'indian',     primaryLanguageId: 'guj' },
  marathi:        { id: 'marathi',        label: 'Marathi',         emoji: '🦁', nationalityId: 'indian',     primaryLanguageId: 'mar' },
  rajasthani:     { id: 'rajasthani',     label: 'Rajasthani',      emoji: '🏜️', nationalityId: 'indian',     primaryLanguageId: 'raj' },
  haryanvi:       { id: 'haryanvi',       label: 'Haryanvi',        emoji: '🐄', nationalityId: 'indian',     primaryLanguageId: 'bgc' },
  himachali:      { id: 'himachali',      label: 'Himachali',       emoji: '🏔️', nationalityId: 'indian',     primaryLanguageId: 'him' },
  // India — East
  bengali:        { id: 'bengali',        label: 'Bengali',         emoji: '🐯', nationalityId: 'indian',     primaryLanguageId: 'ben' },
  assamese:       { id: 'assamese',       label: 'Assamese',        emoji: '🦏', nationalityId: 'indian',     primaryLanguageId: 'asm' },
  odia:           { id: 'odia',           label: 'Odia',            emoji: '🛕', nationalityId: 'indian',     primaryLanguageId: 'ori' },
  bihari:         { id: 'bihari',         label: 'Bihari',          emoji: '🪘', nationalityId: 'indian',     primaryLanguageId: 'mai' },
  kashmiri:       { id: 'kashmiri',       label: 'Kashmiri',        emoji: '🏔️', nationalityId: 'indian',     primaryLanguageId: 'kas' },
  sindhi:         { id: 'sindhi',         label: 'Sindhi',          emoji: '🌙', nationalityId: 'pakistani',  primaryLanguageId: 'snd' },
  baloch:         { id: 'baloch',         label: 'Baloch',          emoji: '🗻', nationalityId: 'pakistani',  primaryLanguageId: 'bal' },
  pashtun:        { id: 'pashtun',        label: 'Pashtun',         emoji: '⚔️', nationalityId: 'afghan',     primaryLanguageId: 'pus' },
  // Nepal
  nepali:         { id: 'nepali',         label: 'Nepali',          emoji: '🏔️', nationalityId: 'nepali',     primaryLanguageId: 'nep' },
  newari:         { id: 'newari',         label: 'Newari',          emoji: '🛕', nationalityId: 'nepali',     primaryLanguageId: 'new' },
  gurung:         { id: 'gurung',         label: 'Gurung',          emoji: '⛰️', nationalityId: 'nepali',     primaryLanguageId: 'gvr' },
  tamang:         { id: 'tamang',         label: 'Tamang',          emoji: '🎋', nationalityId: 'nepali',     primaryLanguageId: 'taj' },
  sherpa:         { id: 'sherpa',         label: 'Sherpa',          emoji: '🏔️', nationalityId: 'nepali',     primaryLanguageId: 'xsr' },
  // Sri Lanka
  sinhalese:      { id: 'sinhalese',      label: 'Sinhalese',       emoji: '🦁', nationalityId: 'srilankan',  primaryLanguageId: 'sin' },
  srilankan_tamil:{ id: 'srilankan_tamil',label: 'Sri Lankan Tamil', emoji: '🌺', nationalityId: 'srilankan',  primaryLanguageId: 'tam' },
  // Bangladesh
  bangladeshi_bengali: { id: 'bangladeshi_bengali', label: 'Bangladeshi', emoji: '🌿', nationalityId: 'bangladeshi', primaryLanguageId: 'ben' },
  // China
  han_chinese:    { id: 'han_chinese',    label: 'Han Chinese',     emoji: '🐉', nationalityId: 'chinese',    primaryLanguageId: 'cmn' },
  cantonese:      { id: 'cantonese',      label: 'Cantonese',       emoji: '🏮', nationalityId: 'chinese',    primaryLanguageId: 'yue' },
  hokkien:        { id: 'hokkien',        label: 'Hokkien',         emoji: '🍵', nationalityId: 'chinese',    primaryLanguageId: 'nan' },
  hakka:          { id: 'hakka',          label: 'Hakka',           emoji: '🏡', nationalityId: 'chinese',    primaryLanguageId: 'hak' },
  shanghainese:   { id: 'shanghainese',   label: 'Shanghainese',    emoji: '🌆', nationalityId: 'chinese',    primaryLanguageId: 'wuu' },
  tibetan:        { id: 'tibetan',        label: 'Tibetan',         emoji: '🏔️', nationalityId: 'chinese',    primaryLanguageId: 'bod' },
  uyghur:         { id: 'uyghur',         label: 'Uyghur',          emoji: '🌵', nationalityId: 'chinese',    primaryLanguageId: 'uig' },
  // East Asia
  mongolian:      { id: 'mongolian',      label: 'Mongolian',       emoji: '🐎', nationalityId: 'mongolian',  primaryLanguageId: 'mon' },
  japanese:       { id: 'japanese',       label: 'Japanese',        emoji: '⛩️', nationalityId: 'japanese',   primaryLanguageId: 'jpn' },
  okinawan:       { id: 'okinawan',       label: 'Okinawan',        emoji: '🌺', nationalityId: 'japanese',   primaryLanguageId: 'ryu' },
  korean:         { id: 'korean',         label: 'Korean',          emoji: '🎎', nationalityId: 'korean',     primaryLanguageId: 'kor' },
  taiwanese:      { id: 'taiwanese',      label: 'Taiwanese',       emoji: '🧋', nationalityId: 'taiwanese',  primaryLanguageId: 'cmn' },
  // Southeast Asia — Indonesia
  javanese:       { id: 'javanese',       label: 'Javanese',        emoji: '🌋', nationalityId: 'indonesian', primaryLanguageId: 'jav' },
  sundanese:      { id: 'sundanese',      label: 'Sundanese',       emoji: '🎋', nationalityId: 'indonesian', primaryLanguageId: 'sun' },
  balinese:       { id: 'balinese',       label: 'Balinese',        emoji: '🕌', nationalityId: 'indonesian', primaryLanguageId: 'ban' },
  madurese:       { id: 'madurese',       label: 'Madurese',        emoji: '🐂', nationalityId: 'indonesian', primaryLanguageId: 'mad' },
  minangkabau:    { id: 'minangkabau',    label: 'Minangkabau',     emoji: '🏠', nationalityId: 'indonesian', primaryLanguageId: 'min' },
  batak:          { id: 'batak',          label: 'Batak',           emoji: '🏞️', nationalityId: 'indonesian', primaryLanguageId: 'btk' },
  bugis:          { id: 'bugis',          label: 'Bugis',           emoji: '⛵', nationalityId: 'indonesian', primaryLanguageId: 'bug' },
  // Southeast Asia — Others
  malay:          { id: 'malay',          label: 'Malay',           emoji: '🌙', nationalityId: 'malaysian',  primaryLanguageId: 'zsm' },
  thai:           { id: 'thai',           label: 'Thai',            emoji: '🐘', nationalityId: 'thai',       primaryLanguageId: 'tha' },
  lao:            { id: 'lao',            label: 'Lao',             emoji: '🐘', nationalityId: 'laotian',    primaryLanguageId: 'lao' },
  khmer:          { id: 'khmer',          label: 'Khmer',           emoji: '🏛️', nationalityId: 'cambodian',  primaryLanguageId: 'khm' },
  vietnamese:     { id: 'vietnamese',     label: 'Vietnamese',      emoji: '🌿', nationalityId: 'vietnamese', primaryLanguageId: 'vie' },
  hmong:          { id: 'hmong',          label: 'Hmong',           emoji: '🌺', nationalityId: 'laotian',    primaryLanguageId: 'hmn' },
  karen:          { id: 'karen',          label: 'Karen',           emoji: '🏡', nationalityId: 'burmese',    primaryLanguageId: 'kar' },
  // Philippines
  tagalog:        { id: 'tagalog',        label: 'Tagalog',         emoji: '🌺', nationalityId: 'filipino',   primaryLanguageId: 'tgl' },
  cebuano:        { id: 'cebuano',        label: 'Cebuano',         emoji: '🌊', nationalityId: 'filipino',   primaryLanguageId: 'ceb' },
  ilocano:        { id: 'ilocano',        label: 'Ilocano',         emoji: '🌾', nationalityId: 'filipino',   primaryLanguageId: 'ilo' },
  kapampangan:    { id: 'kapampangan',    label: 'Kapampangan',     emoji: '🎭', nationalityId: 'filipino',   primaryLanguageId: 'pam' },
  // Middle East
  arab:           { id: 'arab',           label: 'Arab',            emoji: '🌙', nationalityId: 'arabic',     primaryLanguageId: 'ara' },
  persian:        { id: 'persian',        label: 'Persian',         emoji: '🕌', nationalityId: 'iranian',    primaryLanguageId: 'fas' },
  turkish:        { id: 'turkish',        label: 'Turkish',         emoji: '🌙', nationalityId: 'turkish',    primaryLanguageId: 'tur' },
  kurdish:        { id: 'kurdish',        label: 'Kurdish',         emoji: '⛰️', nationalityId: 'iraqi',      primaryLanguageId: 'kur' },
  armenian:       { id: 'armenian',       label: 'Armenian',        emoji: '🕊️', nationalityId: 'armenian',   primaryLanguageId: 'hye' },
  // West Africa
  yoruba:         { id: 'yoruba',         label: 'Yoruba',          emoji: '🥁', nationalityId: 'nigerian',   primaryLanguageId: 'yor' },
  igbo:           { id: 'igbo',           label: 'Igbo',            emoji: '🌿', nationalityId: 'nigerian',   primaryLanguageId: 'ibo' },
  hausa:          { id: 'hausa',          label: 'Hausa',           emoji: '🌾', nationalityId: 'nigerian',   primaryLanguageId: 'hau' },
  akan:           { id: 'akan',           label: 'Akan',            emoji: '🥁', nationalityId: 'ghanaian',   primaryLanguageId: 'aka' },
  ashanti:        { id: 'ashanti',        label: 'Ashanti',         emoji: '👑', nationalityId: 'ghanaian',   primaryLanguageId: 'twi' },
  ewe:            { id: 'ewe',            label: 'Ewe',             emoji: '🌊', nationalityId: 'ghanaian',   primaryLanguageId: 'ewe' },
  wolof:          { id: 'wolof',          label: 'Wolof',           emoji: '🥁', nationalityId: 'senegalese', primaryLanguageId: 'wol' },
  // East Africa
  amhara:         { id: 'amhara',         label: 'Amhara',          emoji: '🦁', nationalityId: 'ethiopian',  primaryLanguageId: 'amh' },
  oromo:          { id: 'oromo',          label: 'Oromo',           emoji: '☕', nationalityId: 'ethiopian',  primaryLanguageId: 'orm' },
  somali:         { id: 'somali',         label: 'Somali',          emoji: '🌊', nationalityId: 'somali',     primaryLanguageId: 'som' },
  kikuyu:         { id: 'kikuyu',         label: 'Kikuyu',          emoji: '🦒', nationalityId: 'kenyan',     primaryLanguageId: 'kik' },
  // South Africa
  zulu:           { id: 'zulu',           label: 'Zulu',            emoji: '🛡️', nationalityId: 'southafrican', primaryLanguageId: 'zul' },
  xhosa:          { id: 'xhosa',          label: 'Xhosa',           emoji: '🌿', nationalityId: 'southafrican', primaryLanguageId: 'xho' },
  // North Africa
  berber:         { id: 'berber',         label: 'Berber',          emoji: '🏜️', nationalityId: 'moroccan',   primaryLanguageId: 'ber' },
  // Europe
  english:        { id: 'english',        label: 'English',         emoji: '🎩', nationalityId: 'british',    primaryLanguageId: 'eng' },
  scottish:       { id: 'scottish',       label: 'Scottish',        emoji: '🏴', nationalityId: 'british',    primaryLanguageId: 'sco' },
  welsh:          { id: 'welsh',          label: 'Welsh',           emoji: '🐉', nationalityId: 'british',    primaryLanguageId: 'wel' },
  irish:          { id: 'irish',          label: 'Irish',           emoji: '☘️', nationalityId: 'irish',      primaryLanguageId: 'gle' },
  french:         { id: 'french',         label: 'French',          emoji: '🗼', nationalityId: 'french',     primaryLanguageId: 'fra' },
  german:         { id: 'german',         label: 'German',          emoji: '🏰', nationalityId: 'german',     primaryLanguageId: 'deu' },
  italian:        { id: 'italian',        label: 'Italian',         emoji: '🍕', nationalityId: 'italian',    primaryLanguageId: 'ita' },
  sicilian:       { id: 'sicilian',       label: 'Sicilian',        emoji: '🌋', nationalityId: 'italian',    primaryLanguageId: 'scn' },
  spanish:        { id: 'spanish',        label: 'Spanish',         emoji: '💃', nationalityId: 'spanish',    primaryLanguageId: 'spa' },
  catalan:        { id: 'catalan',        label: 'Catalan',         emoji: '🌹', nationalityId: 'spanish',    primaryLanguageId: 'cat' },
  greek:          { id: 'greek',          label: 'Greek',           emoji: '🏛️', nationalityId: 'greek',      primaryLanguageId: 'ell' },
  polish:         { id: 'polish',         label: 'Polish',          emoji: '🦅', nationalityId: 'polish',     primaryLanguageId: 'pol' },
  ukrainian:      { id: 'ukrainian',      label: 'Ukrainian',       emoji: '🌻', nationalityId: 'ukrainian',  primaryLanguageId: 'ukr' },
  russian:        { id: 'russian',        label: 'Russian',         emoji: '🏰', nationalityId: 'russian',    primaryLanguageId: 'rus' },
  georgian:       { id: 'georgian',       label: 'Georgian',        emoji: '🎶', nationalityId: 'georgian',   primaryLanguageId: 'kat' },
  portuguese:     { id: 'portuguese',     label: 'Portuguese',      emoji: '🐓', nationalityId: 'portuguese', primaryLanguageId: 'por' },
  dutch:          { id: 'dutch',          label: 'Dutch',           emoji: '🌷', nationalityId: 'dutch',      primaryLanguageId: 'nld' },
  swedish:        { id: 'swedish',        label: 'Swedish',         emoji: '🫎', nationalityId: 'swedish',    primaryLanguageId: 'swe' },
  norwegian:      { id: 'norwegian',      label: 'Norwegian',       emoji: '🦌', nationalityId: 'norwegian',  primaryLanguageId: 'nor' },
  finnish:        { id: 'finnish',        label: 'Finnish',         emoji: '🦌', nationalityId: 'finnish',    primaryLanguageId: 'fin' },
  hungarian:      { id: 'hungarian',      label: 'Hungarian',       emoji: '🌶️', nationalityId: 'hungarian',  primaryLanguageId: 'hun' },
  romanian:       { id: 'romanian',       label: 'Romanian',        emoji: '🐺', nationalityId: 'romanian',   primaryLanguageId: 'ron' },
  serbian:        { id: 'serbian',        label: 'Serbian',         emoji: '🦅', nationalityId: 'serbian',    primaryLanguageId: 'srp' },
  croatian:       { id: 'croatian',       label: 'Croatian',        emoji: '⚓', nationalityId: 'croatian',   primaryLanguageId: 'hrv' },
  albanian:       { id: 'albanian',       label: 'Albanian',        emoji: '🦅', nationalityId: 'albanian',   primaryLanguageId: 'sqi' },
  // Latin America
  mexican:        { id: 'mexican',        label: 'Mexican',         emoji: '🌮', nationalityId: 'mexican',    primaryLanguageId: 'spa' },
  maya:           { id: 'maya',           label: 'Maya',            emoji: '🏛️', nationalityId: 'mexican',    primaryLanguageId: 'myn' },
  colombian:      { id: 'colombian',      label: 'Colombian',       emoji: '☕', nationalityId: 'colombian',  primaryLanguageId: 'spa' },
  peruvian:       { id: 'peruvian',       label: 'Peruvian',        emoji: '🦙', nationalityId: 'peruvian',   primaryLanguageId: 'spa' },
  quechua:        { id: 'quechua',        label: 'Quechua',         emoji: '🦙', nationalityId: 'peruvian',   primaryLanguageId: 'que' },
  brazilian:      { id: 'brazilian',      label: 'Brazilian',       emoji: '🌴', nationalityId: 'brazilian',  primaryLanguageId: 'por' },
  afro_brazilian: { id: 'afro_brazilian', label: 'Afro-Brazilian',  emoji: '🥁', nationalityId: 'brazilian',  primaryLanguageId: 'por' },
  argentinian:    { id: 'argentinian',    label: 'Argentine',       emoji: '🥩', nationalityId: 'argentinian',primaryLanguageId: 'spa' },
  chilean:        { id: 'chilean',        label: 'Chilean',         emoji: '🍷', nationalityId: 'chilean',    primaryLanguageId: 'spa' },
  guarani:        { id: 'guarani',        label: 'Guarani',         emoji: '🌿', nationalityId: 'paraguayan', primaryLanguageId: 'grn' },
  // Pacific
  aboriginal_australian: { id: 'aboriginal_australian', label: 'Aboriginal Australian', emoji: '🦘', nationalityId: 'australian', primaryLanguageId: 'aus' },
  torres_strait:  { id: 'torres_strait',  label: 'Torres Strait Islander', emoji: '🌊', nationalityId: 'australian', primaryLanguageId: 'tsi' },
  maori:          { id: 'maori',          label: 'Maori',           emoji: '🌿', nationalityId: 'newzealander', primaryLanguageId: 'mri' },
  samoan:         { id: 'samoan',         label: 'Samoan',          emoji: '🌊', nationalityId: 'samoan',     primaryLanguageId: 'smo' },
  tongan:         { id: 'tongan',         label: 'Tongan',          emoji: '🌺', nationalityId: 'tongan',     primaryLanguageId: 'ton' },
  fijian:         { id: 'fijian',         label: 'Fijian',          emoji: '🌴', nationalityId: 'fijian',     primaryLanguageId: 'fij' },
};

// ---------------------------------------------------------------------------
// Nationalities — the "middle" tier
// ---------------------------------------------------------------------------
export const NATIONALITIES: Record<string, Nationality> = {
  // South Asia
  indian:       { id: 'indian',       label: 'Indian',       countryCode: 'IND', emoji: '🇮🇳', regionId: 'south_asia',     cultureIds: ['malayali','tamil','telugu','kannada','tulu','konkani','goan','punjabi','gujarati','marathi','bengali','assamese','odia','bihari','rajasthani','haryanvi','himachali','kashmiri'] },
  pakistani:    { id: 'pakistani',    label: 'Pakistani',    countryCode: 'PAK', emoji: '🇵🇰', regionId: 'south_asia',     cultureIds: ['sindhi','baloch'] },
  bangladeshi:  { id: 'bangladeshi',  label: 'Bangladeshi',  countryCode: 'BGD', emoji: '🇧🇩', regionId: 'south_asia',     cultureIds: ['bangladeshi_bengali'] },
  srilankan:    { id: 'srilankan',    label: 'Sri Lankan',   countryCode: 'LKA', emoji: '🇱🇰', regionId: 'south_asia',     cultureIds: ['sinhalese','srilankan_tamil'] },
  nepali:       { id: 'nepali',       label: 'Nepali',       countryCode: 'NPL', emoji: '🇳🇵', regionId: 'south_asia',     cultureIds: ['nepali','newari','gurung','tamang','sherpa'] },
  afghan:       { id: 'afghan',       label: 'Afghan',       countryCode: 'AFG', emoji: '🇦🇫', regionId: 'south_asia',     cultureIds: ['pashtun'] },
  // East Asia
  chinese:      { id: 'chinese',      label: 'Chinese',      countryCode: 'CHN', emoji: '🇨🇳', regionId: 'east_asia',      cultureIds: ['han_chinese','cantonese','hokkien','hakka','shanghainese','tibetan','uyghur'] },
  japanese:     { id: 'japanese',     label: 'Japanese',     countryCode: 'JPN', emoji: '🇯🇵', regionId: 'east_asia',      cultureIds: ['japanese','okinawan'] },
  korean:       { id: 'korean',       label: 'Korean',       countryCode: 'KOR', emoji: '🇰🇷', regionId: 'east_asia',      cultureIds: ['korean'] },
  taiwanese:    { id: 'taiwanese',    label: 'Taiwanese',    countryCode: 'TWN', emoji: '🇹🇼', regionId: 'east_asia',      cultureIds: ['taiwanese'] },
  mongolian:    { id: 'mongolian',    label: 'Mongolian',    countryCode: 'MNG', emoji: '🇲🇳', regionId: 'east_asia',      cultureIds: ['mongolian'] },
  // Southeast Asia
  indonesian:   { id: 'indonesian',   label: 'Indonesian',   countryCode: 'IDN', emoji: '🇮🇩', regionId: 'southeast_asia', cultureIds: ['javanese','sundanese','balinese','madurese','minangkabau','batak','bugis'] },
  malaysian:    { id: 'malaysian',    label: 'Malaysian',    countryCode: 'MYS', emoji: '🇲🇾', regionId: 'southeast_asia', cultureIds: ['malay'] },
  thai:         { id: 'thai',         label: 'Thai',         countryCode: 'THA', emoji: '🇹🇭', regionId: 'southeast_asia', cultureIds: ['thai'] },
  vietnamese:   { id: 'vietnamese',   label: 'Vietnamese',   countryCode: 'VNM', emoji: '🇻🇳', regionId: 'southeast_asia', cultureIds: ['vietnamese'] },
  cambodian:    { id: 'cambodian',    label: 'Cambodian',    countryCode: 'KHM', emoji: '🇰🇭', regionId: 'southeast_asia', cultureIds: ['khmer'] },
  laotian:      { id: 'laotian',      label: 'Laotian',      countryCode: 'LAO', emoji: '🇱🇦', regionId: 'southeast_asia', cultureIds: ['lao','hmong'] },
  burmese:      { id: 'burmese',      label: 'Burmese',      countryCode: 'MMR', emoji: '🇲🇲', regionId: 'southeast_asia', cultureIds: ['karen'] },
  filipino:     { id: 'filipino',     label: 'Filipino',     countryCode: 'PHL', emoji: '🇵🇭', regionId: 'southeast_asia', cultureIds: ['tagalog','cebuano','ilocano','kapampangan'] },
  // Middle East
  arabic:       { id: 'arabic',       label: 'Arab',         countryCode: 'SAU', emoji: '🇸🇦', regionId: 'middle_east',    cultureIds: ['arab'] },
  iranian:      { id: 'iranian',      label: 'Iranian',      countryCode: 'IRN', emoji: '🇮🇷', regionId: 'middle_east',    cultureIds: ['persian'] },
  turkish:      { id: 'turkish',      label: 'Turkish',      countryCode: 'TUR', emoji: '🇹🇷', regionId: 'middle_east',    cultureIds: ['turkish'] },
  iraqi:        { id: 'iraqi',        label: 'Iraqi',        countryCode: 'IRQ', emoji: '🇮🇶', regionId: 'middle_east',    cultureIds: ['kurdish'] },
  armenian:     { id: 'armenian',     label: 'Armenian',     countryCode: 'ARM', emoji: '🇦🇲', regionId: 'middle_east',    cultureIds: ['armenian'] },
  // Africa — West
  nigerian:     { id: 'nigerian',     label: 'Nigerian',     countryCode: 'NGA', emoji: '🇳🇬', regionId: 'west_africa',    cultureIds: ['yoruba','igbo','hausa'] },
  ghanaian:     { id: 'ghanaian',     label: 'Ghanaian',     countryCode: 'GHA', emoji: '🇬🇭', regionId: 'west_africa',    cultureIds: ['akan','ashanti','ewe'] },
  senegalese:   { id: 'senegalese',   label: 'Senegalese',   countryCode: 'SEN', emoji: '🇸🇳', regionId: 'west_africa',    cultureIds: ['wolof'] },
  // Africa — East
  ethiopian:    { id: 'ethiopian',    label: 'Ethiopian',    countryCode: 'ETH', emoji: '🇪🇹', regionId: 'east_africa',    cultureIds: ['amhara','oromo'] },
  somali:       { id: 'somali',       label: 'Somali',       countryCode: 'SOM', emoji: '🇸🇴', regionId: 'east_africa',    cultureIds: ['somali'] },
  kenyan:       { id: 'kenyan',       label: 'Kenyan',       countryCode: 'KEN', emoji: '🇰🇪', regionId: 'east_africa',    cultureIds: ['kikuyu'] },
  // Africa — South
  southafrican: { id: 'southafrican', label: 'South African',countryCode: 'ZAF', emoji: '🇿🇦', regionId: 'southern_africa', cultureIds: ['zulu','xhosa'] },
  // Africa — North
  moroccan:     { id: 'moroccan',     label: 'Moroccan',     countryCode: 'MAR', emoji: '🇲🇦', regionId: 'north_africa',   cultureIds: ['berber'] },
  // Europe
  british:      { id: 'british',      label: 'British',      countryCode: 'GBR', emoji: '🇬🇧', regionId: 'western_europe', cultureIds: ['english','scottish','welsh'] },
  irish:        { id: 'irish',        label: 'Irish',        countryCode: 'IRL', emoji: '🇮🇪', regionId: 'western_europe', cultureIds: ['irish'] },
  french:       { id: 'french',       label: 'French',       countryCode: 'FRA', emoji: '🇫🇷', regionId: 'western_europe', cultureIds: ['french'] },
  german:       { id: 'german',       label: 'German',       countryCode: 'DEU', emoji: '🇩🇪', regionId: 'western_europe', cultureIds: ['german'] },
  italian:      { id: 'italian',      label: 'Italian',      countryCode: 'ITA', emoji: '🇮🇹', regionId: 'western_europe', cultureIds: ['italian','sicilian'] },
  spanish:      { id: 'spanish',      label: 'Spanish',      countryCode: 'ESP', emoji: '🇪🇸', regionId: 'western_europe', cultureIds: ['spanish','catalan'] },
  portuguese:   { id: 'portuguese',   label: 'Portuguese',   countryCode: 'PRT', emoji: '🇵🇹', regionId: 'western_europe', cultureIds: ['portuguese'] },
  greek:        { id: 'greek',        label: 'Greek',        countryCode: 'GRC', emoji: '🇬🇷', regionId: 'western_europe', cultureIds: ['greek'] },
  dutch:        { id: 'dutch',        label: 'Dutch',        countryCode: 'NLD', emoji: '🇳🇱', regionId: 'western_europe', cultureIds: ['dutch'] },
  swedish:      { id: 'swedish',      label: 'Swedish',      countryCode: 'SWE', emoji: '🇸🇪', regionId: 'northern_europe',cultureIds: ['swedish'] },
  norwegian:    { id: 'norwegian',    label: 'Norwegian',    countryCode: 'NOR', emoji: '🇳🇴', regionId: 'northern_europe',cultureIds: ['norwegian'] },
  finnish:      { id: 'finnish',      label: 'Finnish',      countryCode: 'FIN', emoji: '🇫🇮', regionId: 'northern_europe',cultureIds: ['finnish'] },
  polish:       { id: 'polish',       label: 'Polish',       countryCode: 'POL', emoji: '🇵🇱', regionId: 'eastern_europe', cultureIds: ['polish'] },
  ukrainian:    { id: 'ukrainian',    label: 'Ukrainian',    countryCode: 'UKR', emoji: '🇺🇦', regionId: 'eastern_europe', cultureIds: ['ukrainian'] },
  russian:      { id: 'russian',      label: 'Russian',      countryCode: 'RUS', emoji: '🇷🇺', regionId: 'eastern_europe', cultureIds: ['russian'] },
  hungarian:    { id: 'hungarian',    label: 'Hungarian',    countryCode: 'HUN', emoji: '🇭🇺', regionId: 'eastern_europe', cultureIds: ['hungarian'] },
  romanian:     { id: 'romanian',     label: 'Romanian',     countryCode: 'ROU', emoji: '🇷🇴', regionId: 'eastern_europe', cultureIds: ['romanian'] },
  serbian:      { id: 'serbian',      label: 'Serbian',      countryCode: 'SRB', emoji: '🇷🇸', regionId: 'eastern_europe', cultureIds: ['serbian'] },
  croatian:     { id: 'croatian',     label: 'Croatian',     countryCode: 'HRV', emoji: '🇭🇷', regionId: 'eastern_europe', cultureIds: ['croatian'] },
  georgian:     { id: 'georgian',     label: 'Georgian',     countryCode: 'GEO', emoji: '🇬🇪', regionId: 'eastern_europe', cultureIds: ['georgian'] },
  albanian:     { id: 'albanian',     label: 'Albanian',     countryCode: 'ALB', emoji: '🇦🇱', regionId: 'eastern_europe', cultureIds: ['albanian'] },
  // Americas
  mexican:      { id: 'mexican',      label: 'Mexican',      countryCode: 'MEX', emoji: '🇲🇽', regionId: 'latin_america',  cultureIds: ['mexican','maya'] },
  colombian:    { id: 'colombian',    label: 'Colombian',    countryCode: 'COL', emoji: '🇨🇴', regionId: 'latin_america',  cultureIds: ['colombian'] },
  peruvian:     { id: 'peruvian',     label: 'Peruvian',     countryCode: 'PER', emoji: '🇵🇪', regionId: 'latin_america',  cultureIds: ['peruvian','quechua'] },
  brazilian:    { id: 'brazilian',    label: 'Brazilian',    countryCode: 'BRA', emoji: '🇧🇷', regionId: 'latin_america',  cultureIds: ['brazilian','afro_brazilian'] },
  argentinian:  { id: 'argentinian',  label: 'Argentine',    countryCode: 'ARG', emoji: '🇦🇷', regionId: 'latin_america',  cultureIds: ['argentinian'] },
  chilean:      { id: 'chilean',      label: 'Chilean',      countryCode: 'CHL', emoji: '🇨🇱', regionId: 'latin_america',  cultureIds: ['chilean'] },
  paraguayan:   { id: 'paraguayan',   label: 'Paraguayan',   countryCode: 'PRY', emoji: '🇵🇾', regionId: 'latin_america',  cultureIds: ['guarani'] },
  // Pacific
  australian:   { id: 'australian',   label: 'Australian',   countryCode: 'AUS', emoji: '🇦🇺', regionId: 'pacific',        cultureIds: ['aboriginal_australian','torres_strait'] },
  newzealander: { id: 'newzealander', label: 'New Zealander',countryCode: 'NZL', emoji: '🇳🇿', regionId: 'pacific',        cultureIds: ['maori'] },
  samoan:       { id: 'samoan',       label: 'Samoan',       countryCode: 'WSM', emoji: '🇼🇸', regionId: 'pacific',        cultureIds: ['samoan'] },
  tongan:       { id: 'tongan',       label: 'Tongan',       countryCode: 'TON', emoji: '🇹🇴', regionId: 'pacific',        cultureIds: ['tongan'] },
  fijian:       { id: 'fijian',       label: 'Fijian',       countryCode: 'FJI', emoji: '🇫🇯', regionId: 'pacific',        cultureIds: ['fijian'] },
};

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------
export const REGIONS: Record<string, Region> = {
  south_asia:      { id: 'south_asia',      label: 'South Asia',      continentId: 'asia',    nationalityIds: ['indian','pakistani','bangladeshi','srilankan','nepali','afghan'] },
  east_asia:       { id: 'east_asia',       label: 'East Asia',       continentId: 'asia',    nationalityIds: ['chinese','japanese','korean','taiwanese','mongolian'] },
  southeast_asia:  { id: 'southeast_asia',  label: 'Southeast Asia',  continentId: 'asia',    nationalityIds: ['indonesian','malaysian','thai','vietnamese','cambodian','laotian','burmese','filipino'] },
  middle_east:     { id: 'middle_east',     label: 'Middle East',     continentId: 'asia',    nationalityIds: ['arabic','iranian','turkish','iraqi','armenian'] },
  west_africa:     { id: 'west_africa',     label: 'West Africa',     continentId: 'africa',  nationalityIds: ['nigerian','ghanaian','senegalese'] },
  east_africa:     { id: 'east_africa',     label: 'East Africa',     continentId: 'africa',  nationalityIds: ['ethiopian','somali','kenyan'] },
  southern_africa: { id: 'southern_africa', label: 'Southern Africa', continentId: 'africa',  nationalityIds: ['southafrican'] },
  north_africa:    { id: 'north_africa',    label: 'North Africa',    continentId: 'africa',  nationalityIds: ['moroccan'] },
  western_europe:  { id: 'western_europe',  label: 'Western Europe',  continentId: 'europe',  nationalityIds: ['british','irish','french','german','italian','spanish','portuguese','greek','dutch'] },
  northern_europe: { id: 'northern_europe', label: 'Northern Europe', continentId: 'europe',  nationalityIds: ['swedish','norwegian','finnish'] },
  eastern_europe:  { id: 'eastern_europe',  label: 'Eastern Europe',  continentId: 'europe',  nationalityIds: ['polish','ukrainian','russian','hungarian','romanian','serbian','croatian','georgian','albanian'] },
  latin_america:   { id: 'latin_america',   label: 'Latin America',   continentId: 'americas',nationalityIds: ['mexican','colombian','peruvian','brazilian','argentinian','chilean','paraguayan'] },
  pacific:         { id: 'pacific',         label: 'Pacific',         continentId: 'oceania', nationalityIds: ['australian','newzealander','samoan','tongan','fijian'] },
};

// ---------------------------------------------------------------------------
// Continents
// ---------------------------------------------------------------------------
export const CONTINENTS: Record<string, Continent> = {
  asia:     { id: 'asia',     label: 'Asia',          regionIds: ['south_asia','east_asia','southeast_asia','middle_east'] },
  africa:   { id: 'africa',   label: 'Africa',        regionIds: ['west_africa','east_africa','southern_africa','north_africa'] },
  europe:   { id: 'europe',   label: 'Europe',        regionIds: ['western_europe','northern_europe','eastern_europe'] },
  americas: { id: 'americas', label: 'The Americas',  regionIds: ['latin_america'] },
  oceania:  { id: 'oceania',  label: 'Oceania',       regionIds: ['pacific'] },
};

// ---------------------------------------------------------------------------
// Diaspora groups — cross-national meta-groups for broad discovery
// ---------------------------------------------------------------------------
export interface DiasporaGroup {
  id: string;
  label: string;
  emoji: string;
  nationalityIds: string[];
}

export const DIASPORA_GROUPS: Record<string, DiasporaGroup> = {
  south_asian_diaspora:     { id: 'south_asian_diaspora',     label: 'South Asian Diaspora',     emoji: '🌏', nationalityIds: ['indian','pakistani','bangladeshi','srilankan','nepali'] },
  east_asian_diaspora:      { id: 'east_asian_diaspora',      label: 'East Asian Diaspora',      emoji: '🐉', nationalityIds: ['chinese','japanese','korean','taiwanese'] },
  southeast_asian_diaspora: { id: 'southeast_asian_diaspora', label: 'Southeast Asian Diaspora', emoji: '🌺', nationalityIds: ['indonesian','malaysian','thai','vietnamese','filipino'] },
  african_diaspora:         { id: 'african_diaspora',         label: 'African Diaspora',         emoji: '🌍', nationalityIds: ['nigerian','ghanaian','ethiopian','somali','kenyan','southafrican','senegalese'] },
  latin_diaspora:           { id: 'latin_diaspora',           label: 'Latin Diaspora',           emoji: '💃', nationalityIds: ['mexican','colombian','peruvian','brazilian','argentinian','chilean'] },
  middle_eastern_diaspora:  { id: 'middle_eastern_diaspora',  label: 'Middle Eastern Diaspora',  emoji: '🌙', nationalityIds: ['arabic','iranian','turkish','iraqi','armenian'] },
  pacific_diaspora:         { id: 'pacific_diaspora',         label: 'Pacific Islander Diaspora',emoji: '🌊', nationalityIds: ['samoan','tongan','fijian','newzealander'] },
  european_diaspora:        { id: 'european_diaspora',        label: 'European Diaspora',        emoji: '🏰', nationalityIds: ['british','irish','italian','greek','german','french','spanish','portuguese','polish','ukrainian'] },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Get all cultures for a nationality */
export function getCulturesForNationality(nationalityId: string): Culture[] {
  const nat = NATIONALITIES[nationalityId];
  if (!nat) return [];
  return nat.cultureIds.map((id) => CULTURES[id]).filter(Boolean);
}

/** Get diaspora groups that include a given nationality */
export function getDiasporaGroupsForNationality(nationalityId: string): DiasporaGroup[] {
  return Object.values(DIASPORA_GROUPS).filter((g) =>
    g.nationalityIds.includes(nationalityId),
  );
}

/** Search nationalities by label */
export function searchNationalities(query: string): Nationality[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return Object.values(NATIONALITIES);
  return Object.values(NATIONALITIES).filter((n) =>
    n.label.toLowerCase().includes(needle) || n.countryCode.toLowerCase().includes(needle),
  );
}

/** Search cultures by label */
export function searchCultures(query: string, nationalityId?: string): Culture[] {
  const pool = nationalityId
    ? getCulturesForNationality(nationalityId)
    : Object.values(CULTURES);
  const needle = query.trim().toLowerCase();
  if (!needle) return pool;
  return pool.filter((c) => c.label.toLowerCase().includes(needle));
}

/** Get all nationalities sorted alphabetically */
export const ALL_NATIONALITIES = Object.values(NATIONALITIES).sort((a, b) =>
  a.label.localeCompare(b.label),
);

/** Get all cultures sorted alphabetically */
export const ALL_CULTURES = Object.values(CULTURES).sort((a, b) =>
  a.label.localeCompare(b.label),
);
