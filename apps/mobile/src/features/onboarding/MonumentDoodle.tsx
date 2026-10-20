import React from 'react';
import Svg, { Path, Circle, Line, Rect, G } from 'react-native-svg';
import { colors, iconTokens } from '../../theme/tokens';
import type { SupportedLanguage } from './onboardingStorage';

export interface MonumentDoodleProps {
  language: SupportedLanguage;
  size?: number;
}

export function MonumentDoodle({ language, size = 56 }: MonumentDoodleProps) {
  const strokeWidth = iconTokens.strokeWidth;
  const primary = colors.primary;
  const ink = colors.ink;

  switch (language) {
    case 'te':
      // Charminar (Hyderabad, Telangana / AP) - 4 minarets, central arches & balconies
      return (
        <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
          {/* Base plinth */}
          <Line x1="6" y1="50" x2="50" y2="50" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          
          {/* Main rectangular block */}
          <Rect x="14" y="24" width="28" height="26" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />
          
          {/* Central grand arch */}
          <Path
            d="M21 50 V36 C21 32 24 29 28 29 C32 29 35 32 35 36 V50"
            stroke={primary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Upper balcony cornice */}
          <Line x1="12" y1="24" x2="44" y2="24" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="15" y1="20" x2="41" y2="20" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Left minaret */}
          <Line x1="11" y1="50" x2="11" y2="12" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="15" y1="50" x2="15" y2="12" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M9 12 H17" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M10 12 C10 8 16 8 16 12" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="13" y1="8" x2="13" y2="5" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Right minaret */}
          <Line x1="41" y1="50" x2="41" y2="12" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="45" y1="50" x2="45" y2="12" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M39 12 H47" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M40 12 C40 8 46 8 46 12" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="43" y1="8" x2="43" y2="5" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'hi':
      // India Gate (Delhi / North) - Majestic triumphal arch & stepped attic
      return (
        <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
          {/* Stepped foundation plinth */}
          <Line x1="8" y1="50" x2="48" y2="50" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="11" y1="47" x2="45" y2="47" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Twin main pillars */}
          <Rect x="13" y="24" width="8" height="23" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Rect x="35" y="24" width="8" height="23" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />

          {/* Grand central arch */}
          <Path
            d="M21 47 V33 C21 27 25 24 28 24 C31 24 35 27 35 33 V47"
            stroke={primary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Entablature and attic */}
          <Line x1="11" y1="24" x2="45" y2="24" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="13" y1="20" x2="43" y2="20" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Rect x="15" y="14" width="26" height="6" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />

          {/* Top bowl / urn pedestal */}
          <Path d="M22 14 L24 10 H32 L34 14" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="26" y1="10" x2="30" y2="10" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'en':
      // Parliament House / Ashoka Chakra (India / General) - Colonnade & Ashoka wheel
      return (
        <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
          {/* Outer circular colonnade */}
          <Circle cx="28" cy="28" r="21" stroke={ink} strokeWidth={strokeWidth} />
          <Circle cx="28" cy="28" r="17" stroke={primary} strokeWidth={strokeWidth} strokeDasharray="3 3" />
          
          {/* Inner Ashoka hub */}
          <Circle cx="28" cy="28" r="4" stroke={primary} strokeWidth={strokeWidth} />
          
          {/* Spokes */}
          <Line x1="28" y1="11" x2="28" y2="24" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="28" y1="32" x2="28" y2="45" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="11" y1="28" x2="24" y2="28" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="32" y1="28" x2="45" y2="28" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />

          <Line x1="16" y1="16" x2="25" y2="25" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="31" y1="31" x2="40" y2="40" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="40" y1="16" x2="31" y2="25" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="25" y1="31" x2="16" y2="40" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'ta':
      // Temple Gopuram (Tamil Nadu - Brihadeeswarar / Meenakshi) - Stepped tower & kalasam
      return (
        <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
          {/* Plinth */}
          <Line x1="8" y1="50" x2="48" y2="50" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Gateway entry at base */}
          <Rect x="12" y="38" width="32" height="12" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Path d="M23 50 V43 C23 41 25 39 28 39 C31 39 33 41 33 43 V50" stroke={primary} strokeWidth={strokeWidth} />

          {/* Tier 1 */}
          <Line x1="14" y1="38" x2="42" y2="38" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M15 38 L18 29 H38 L41 38" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />

          {/* Tier 2 */}
          <Line x1="17" y1="29" x2="39" y2="29" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M19 29 L21 21 H35 L37 29" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />

          {/* Tier 3 */}
          <Line x1="20" y1="21" x2="36" y2="21" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M22 21 L23 15 H33 L34 21" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />

          {/* Top barrel vault roof & 3 Kalasams */}
          <Path d="M20 15 Q28 11 36 15 Z" stroke={primary} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Line x1="24" y1="12" x2="24" y2="7" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="28" y1="11" x2="28" y2="6" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="32" y1="12" x2="32" y2="7" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'kn':
      // Hampi Stone Chariot (Karnataka) - Stone wheels & Dravidian superstructure
      return (
        <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
          {/* Ground line */}
          <Line x1="6" y1="50" x2="50" y2="50" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Left stone wheel */}
          <Circle cx="16" cy="42" r="7" stroke={primary} strokeWidth={strokeWidth} />
          <Circle cx="16" cy="42" r="2.5" stroke={ink} strokeWidth={strokeWidth} />

          {/* Right stone wheel */}
          <Circle cx="40" cy="42" r="7" stroke={primary} strokeWidth={strokeWidth} />
          <Circle cx="40" cy="42" r="2.5" stroke={ink} strokeWidth={strokeWidth} />

          {/* Chariot base platform */}
          <Rect x="10" y="31" width="36" height="5" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />

          {/* Main shrine chamber */}
          <Rect x="15" y="21" width="26" height="10" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Line x1="28" y1="21" x2="28" y2="31" stroke={primary} strokeWidth={strokeWidth} />

          {/* Tiered shrine roof */}
          <Path d="M17 21 L20 14 H36 L39 21" stroke={primary} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Path d="M22 14 L24 9 H32 L34 14" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />

          {/* Kalasa finial */}
          <Line x1="28" y1="9" x2="28" y2="5" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'ml':
      // Kerala Houseboat (Kettuvallam) & Coconut Palm
      return (
        <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
          {/* Water ripples */}
          <Path d="M6 50 Q12 47 18 50 T30 50 T42 50 T52 50" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Houseboat curved hull */}
          <Path
            d="M8 44 Q10 46 20 46 H38 Q46 45 48 39 Q38 41 24 41 Q14 41 8 44 Z"
            stroke={ink}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />

          {/* Thatched curved roof cabin */}
          <Path
            d="M16 41 C16 32 20 28 28 28 C36 28 40 32 40 41"
            stroke={ink}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Line x1="22" y1="33" x2="34" y2="33" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="24" y1="41" x2="24" y2="35" stroke={primary} strokeWidth={strokeWidth} />
          <Line x1="32" y1="41" x2="32" y2="35" stroke={primary} strokeWidth={strokeWidth} />

          {/* Coconut palm trunk */}
          <Path d="M46 44 Q49 32 45 18" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Palm fronds */}
          <Path d="M45 18 Q38 15 36 21" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M45 18 Q44 11 41 11" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M45 18 Q50 12 53 15" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M45 18 Q52 20 54 26" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'mr':
      // Gateway of India (Mumbai, Maharashtra) - Arch with side turrets and cupolas
      return (
        <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
          {/* Seafront foundation */}
          <Line x1="7" y1="50" x2="49" y2="50" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Central main archway */}
          <Path
            d="M21 50 V34 C21 28 25 25 28 25 C31 25 35 28 35 34 V50"
            stroke={primary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Flanking side arches */}
          <Path d="M12 50 V40 C12 37 14 35 16 35 C18 35 20 37 20 40 V50" stroke={ink} strokeWidth={strokeWidth} />
          <Path d="M36 50 V40 C36 37 38 35 40 35 C42 35 44 37 44 40 V50" stroke={ink} strokeWidth={strokeWidth} />

          {/* Upper balcony parapet */}
          <Line x1="10" y1="25" x2="46" y2="25" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="21" x2="44" y2="21" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Rect x="14" y="15" width="28" height="6" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />

          {/* Left domelet / cupola */}
          <Path d="M9 25 V17 Q11 13 13 17 V25" stroke={primary} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Line x1="11" y1="13" x2="11" y2="10" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Right domelet / cupola */}
          <Path d="M43 25 V17 Q45 13 47 17 V25" stroke={primary} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Line x1="45" y1="13" x2="45" y2="10" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'bn':
      // Howrah Bridge (Kolkata, West Bengal) - Cantilever truss & river
      return (
        <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
          {/* Hooghly river water */}
          <Path d="M6 50 Q12 47 18 50 T30 50 T42 50 T52 50" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Left main cantilever tower */}
          <Path d="M11 46 L14 15 H18 L21 46" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Line x1="12" y1="30" x2="20" y2="30" stroke={primary} strokeWidth={strokeWidth} />
          <Line x1="13" y1="20" x2="19" y2="20" stroke={primary} strokeWidth={strokeWidth} />

          {/* Right main cantilever tower */}
          <Path d="M35 46 L38 15 H42 L45 46" stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Line x1="36" y1="30" x2="44" y2="30" stroke={primary} strokeWidth={strokeWidth} />
          <Line x1="37" y1="20" x2="43" y2="20" stroke={primary} strokeWidth={strokeWidth} />

          {/* Suspended road deck */}
          <Line x1="6" y1="44" x2="50" y2="44" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Central suspension arc & truss cables */}
          <Path d="M16 15 Q28 32 40 15" stroke={primary} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="22" y1="22" x2="22" y2="44" stroke={ink} strokeWidth={strokeWidth} strokeDasharray="2 2" />
          <Line x1="28" y1="28" x2="28" y2="44" stroke={primary} strokeWidth={strokeWidth} />
          <Line x1="34" y1="22" x2="34" y2="44" stroke={ink} strokeWidth={strokeWidth} strokeDasharray="2 2" />
        </Svg>
      );
  }
}
