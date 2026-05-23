export interface CommunityGroup {
  label: string;
  emoji: string;
  color: string;
  members: string[];
}

export const communityGroups: CommunityGroup[] = [
  {
    label: 'Indigenous Australian',
    emoji: '🪃',
    color: '#E8A838',
    members: ['Aboriginal & Torres Strait Islander', 'First Nations'],
  },
  {
    label: 'South Asian',
    emoji: '🌏',
    color: '#E05C3A',
    // Tamil and Punjabi are multi-national linguistic identities — split by country.
    // Bengali (West Bengal/India) is distinct from Bangladeshi which has its own entry.
    members: [
      'Indian',
      'Malayalee',
      'Tamil (India)',
      'Tamil (Sri Lanka)',
      'Punjabi (India)',
      'Punjabi (Pakistan)',
      'Bengali',
      'Gujarati',
      'Telugu',
      'Marathi',
      'Sri Lankan',
      'Nepali',
      'Pakistani',
      'Bangladeshi',
    ],
  },
  {
    label: 'East Asian',
    emoji: '🏮',
    color: '#E91E63',
    // Cantonese is primarily the Hong Kong / Guangdong diaspora — use HK flag.
    members: ['Chinese', 'Cantonese', 'Korean', 'Japanese', 'Taiwanese'],
  },
  {
    label: 'Southeast Asian',
    emoji: '🌴',
    color: '#F39C12',
    members: ['Filipino', 'Vietnamese', 'Indonesian', 'Malaysian', 'Thai', 'Cambodian', 'Burmese'],
  },
  {
    label: 'Pacific',
    emoji: '🌊',
    color: '#2980B9',
    members: ['Pacific Islander', 'Māori', 'Samoan', 'Tongan', 'Fijian'],
  },
  {
    label: 'Middle East & North Africa',
    emoji: '🌙',
    color: '#9B59B6',
    members: ['Lebanese', 'Arab', 'Egyptian', 'Persian', 'Turkish', 'Afghan', 'Iraqi'],
  },
  {
    label: 'African',
    emoji: '🌍',
    // Brighter green so chips are visible on the dark glassmorphism background
    color: '#3DDC84',
    members: ['West African', 'East African', 'South African', 'Nigerian', 'Ghanaian', 'Ethiopian', 'Somali', 'Sudanese'],
  },
  {
    label: 'European',
    emoji: '🏛️',
    color: '#3498DB',
    members: ['Greek', 'Italian', 'Portuguese', 'Spanish'],
  },
  {
    label: 'Latin American',
    emoji: '🎉',
    color: '#E67E22',
    members: ['Latin American', 'Brazilian'],
  },
  {
    label: 'Interest-based',
    emoji: '🤝',
    color: '#6C63FF',
    members: ['Multicultural', 'Business Networking', 'Youth', 'Religious', 'Arts & Culture', 'Council Events'],
  },
];

// Flat list preserved for backwards compat
export const onboardingCommunities: string[] = communityGroups.flatMap(g => g.members);

export const communityFlags: Record<string, string> = {
  // Indigenous
  'Aboriginal & Torres Strait Islander': '🪃',
  'First Nations': '🌿',

  // South Asian — single-country communities get their flag,
  // multi-national linguistic identities get a speech/language glyph
  // or are split into explicit country variants.
  'Indian': '🇮🇳',
  'Malayalee': '🇮🇳',       // Kerala, India
  'Tamil (India)': '🇮🇳',   // Tamil Nadu diaspora
  'Tamil (Sri Lanka)': '🇱🇰', // Sri Lankan Tamil diaspora
  'Punjabi (India)': '🇮🇳',  // Indian Punjabi
  'Punjabi (Pakistan)': '🇵🇰', // Pakistani Punjabi
  'Bengali': '🇮🇳',          // West Bengali (Indian); Bangladeshi has its own entry
  'Gujarati': '🇮🇳',
  'Telugu': '🇮🇳',
  'Marathi': '🇮🇳',
  'Sri Lankan': '🇱🇰',
  'Nepali': '🇳🇵',
  'Pakistani': '🇵🇰',
  'Bangladeshi': '🇧🇩',

  // East Asian
  'Chinese': '🇨🇳',
  'Cantonese': '🇭🇰',  // Predominantly Hong Kong / Guangdong diaspora
  'Korean': '🇰🇷',
  'Japanese': '🇯🇵',
  'Taiwanese': '🇹🇼',

  // Southeast Asian
  'Filipino': '🇵🇭',
  'Vietnamese': '🇻🇳',
  'Indonesian': '🇮🇩',
  'Malaysian': '🇲🇾',
  'Thai': '🇹🇭',
  'Cambodian': '🇰🇭',
  'Burmese': '🇲🇲',

  // Pacific
  'Pacific Islander': '🌊',
  'Māori': '🇳🇿',
  'Samoan': '🇼🇸',
  'Tongan': '🇹🇴',
  'Fijian': '🇫🇯',

  // Middle East & North Africa
  // Arab spans many countries — use the crescent as a regional symbol
  'Lebanese': '🇱🇧',
  'Arab': '🌙',
  'Egyptian': '🇪🇬',
  'Persian': '🇮🇷',
  'Turkish': '🇹🇷',
  'Afghan': '🇦🇫',
  'Iraqi': '🇮🇶',

  // African — regional communities get a continent glyph
  'West African': '🌍',
  'East African': '🌍',
  'South African': '🇿🇦',
  'Nigerian': '🇳🇬',
  'Ghanaian': '🇬🇭',
  'Ethiopian': '🇪🇹',
  'Somali': '🇸🇴',
  'Sudanese': '🇸🇩',

  // European
  'Greek': '🇬🇷',
  'Italian': '🇮🇹',
  'Portuguese': '🇵🇹',
  'Spanish': '🇪🇸',

  // Latin American
  'Latin American': '🌎',
  'Brazilian': '🇧🇷',

  // Interest-based
  'Multicultural': '🌏',
  'Business Networking': '💼',
  'Youth': '🚀',
  'Religious': '🕊️',
  'Arts & Culture': '🎭',
  'Council Events': '🏛️',
};

// kept for any existing imports
export const communityIcons: Record<string, string> = {
  'Aboriginal & Torres Strait Islander': 'earth',
  'First Nations': 'earth',
  'Pacific Islander': 'earth',
  'Māori': 'earth',
  'Multicultural': 'people',
  'Business Networking': 'briefcase',
  'Youth': 'rocket',
  'Religious': 'leaf',
  'Arts & Culture': 'musical-notes',
  'Council Events': 'business',
};
