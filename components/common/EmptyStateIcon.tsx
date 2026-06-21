import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, {
  Rect, Circle, Path, Text as SvgText, Line, G,
  Defs, ClipPath, LinearGradient, Stop,
} from 'react-native-svg';

export type EmptyStateIconName =
  | 'watchlist'
  | 'diary'
  | 'reviews'
  | 'search'
  | 'notifications'
  | 'avatar'
  | 'default-poster'
  | 'brand-mark'
  | 'offline'
  | 'google';

interface EmptyStateIconProps {
  name: EmptyStateIconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// All illustrations share the brand system: scarlet/red strokes (#E01E37),
// muted rose-gray secondary (#A89098), warm dark fills (#0A0A0B / #3A2A30),
// and gold (#F5C518) reserved exclusively for star ratings.
export const EmptyStateIcon: React.FC<EmptyStateIconProps> = ({
  name,
  size = 96,
  style,
}) => {
  // Shared props for the 512×512 outline illustrations
  const outline = {
    viewBox: '0 0 512 512',
    width: size,
    height: size,
    style,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'watchlist':
      // Bookmark + faint list lines — "Your watchlist is empty"
      return (
        <Svg {...outline}>
          <Line x1={118} y1={186} x2={210} y2={186} stroke="#3A2A30" strokeWidth={14} />
          <Line x1={118} y1={256} x2={190} y2={256} stroke="#3A2A30" strokeWidth={14} />
          <Line x1={118} y1={326} x2={170} y2={326} stroke="#3A2A30" strokeWidth={14} />
          <Path d="M250 140 H372 a18 18 0 0 1 18 18 V392 L311 338 L232 392 V158 a18 18 0 0 1 18 -18 Z" stroke="#E01E37" strokeWidth={16} />
          <Line x1={311} y1={208} x2={311} y2={276} stroke="#E01E37" strokeWidth={16} />
          <Line x1={277} y1={242} x2={345} y2={242} stroke="#E01E37" strokeWidth={16} />
        </Svg>
      );

    case 'diary':
      // Calendar + film strip — "No entries yet"
      return (
        <Svg {...outline}>
          <Rect x={128} y={150} width={200} height={220} rx={18} stroke="#E01E37" strokeWidth={16} />
          <Line x1={128} y1={206} x2={328} y2={206} stroke="#E01E37" strokeWidth={16} />
          <Line x1={180} y1={132} x2={180} y2={172} stroke="#E01E37" strokeWidth={16} />
          <Line x1={276} y1={132} x2={276} y2={172} stroke="#E01E37" strokeWidth={16} />
          <Circle cx={178} cy={258} r={9} fill="#A89098" />
          <Circle cx={228} cy={258} r={9} fill="#A89098" />
          <Circle cx={278} cy={258} r={9} fill="#E01E37" />
          <Circle cx={178} cy={312} r={9} fill="#A89098" />
          <Circle cx={228} cy={312} r={9} fill="#A89098" />
          <Rect x={316} y={246} width={68} height={150} rx={8} fill="#0A0A0B" stroke="#3A2A30" strokeWidth={12} transform="rotate(8 350 321)" />
          <G transform="rotate(8 350 321)" fill="#3A2A30">
            <Rect x={322} y={262} width={10} height={12} rx={2} />
            <Rect x={368} y={262} width={10} height={12} rx={2} />
            <Rect x={322} y={368} width={10} height={12} rx={2} />
            <Rect x={368} y={368} width={10} height={12} rx={2} />
          </G>
        </Svg>
      );

    case 'reviews':
      // Page + gold stars + pencil — "Write your first review"
      return (
        <Svg {...outline}>
          <Path d="M150 130 H300 L350 180 V382 H150 Z" stroke="#E01E37" strokeWidth={16} />
          <Path d="M300 130 V180 H350" stroke="#E01E37" strokeWidth={16} />
          <G fill="#F5C518">
            <Path d="M180 232 l9 18 20 3 -14.5 14 3.5 20 -18 -9.5 -18 9.5 3.5 -20 -14.5 -14 20 -3 z" />
            <Path d="M238 232 l9 18 20 3 -14.5 14 3.5 20 -18 -9.5 -18 9.5 3.5 -20 -14.5 -14 20 -3 z" />
            <Path d="M296 232 l9 18 20 3 -14.5 14 3.5 20 -18 -9.5 -18 9.5 3.5 -20 -14.5 -14 20 -3 z" />
          </G>
          <Path d="M300 384 L388 296 L420 328 L332 416 L290 426 Z" fill="#0A0A0B" stroke="#A89098" strokeWidth={14} />
          <Line x1={372} y1={312} x2={404} y2={344} stroke="#A89098" strokeWidth={14} />
        </Svg>
      );

    case 'search':
      // Magnifier + "?" — "No results found"
      return (
        <Svg {...outline}>
          <Circle cx={232} cy={232} r={104} stroke="#E01E37" strokeWidth={18} />
          <Line x1={308} y1={308} x2={384} y2={384} stroke="#E01E37" strokeWidth={22} />
          <Path d="M204 206 a30 30 0 1 1 42 28 c-12 8 -14 16 -14 28" stroke="#A89098" strokeWidth={16} />
          <Circle cx={232} cy={298} r={9} fill="#A89098" />
        </Svg>
      );

    case 'notifications':
      // Sleeping bell + Zzz — "You're all caught up"
      return (
        <Svg {...outline}>
          <G transform="rotate(-12 240 280)">
            <Path d="M168 320 C168 250 188 196 240 196 C292 196 312 250 312 320 Z" stroke="#E01E37" strokeWidth={16} />
            <Path d="M150 320 H330" stroke="#E01E37" strokeWidth={16} />
            <Path d="M216 352 a24 20 0 0 0 48 0" stroke="#E01E37" strokeWidth={16} />
            <Path d="M224 186 a16 16 0 0 1 32 0" stroke="#E01E37" strokeWidth={16} />
            <Path d="M218 250 q18 -16 40 -4" stroke="#A89098" strokeWidth={12} />
          </G>
          <SvgText x={330} y={216} fontSize={46} fontWeight="700" fill="#A89098">z</SvgText>
          <SvgText x={368} y={178} fontSize={34} fontWeight="700" fill="#A89098">z</SvgText>
          <SvgText x={398} y={146} fontSize={24} fontWeight="700" fill="#A89098">z</SvgText>
        </Svg>
      );

    case 'default-poster':
      // Film frame + faint "W" reel — missing artwork fallback
      return (
        <Svg {...outline}>
          <Rect x={150} y={120} width={212} height={272} rx={16} stroke="#3A2A30" strokeWidth={14} />
          <G fill="#3A2A30">
            <Rect x={166} y={142} width={16} height={22} rx={4} />
            <Rect x={166} y={190} width={16} height={22} rx={4} />
            <Rect x={166} y={238} width={16} height={22} rx={4} />
            <Rect x={166} y={286} width={16} height={22} rx={4} />
            <Rect x={166} y={334} width={16} height={22} rx={4} />
            <Rect x={330} y={142} width={16} height={22} rx={4} />
            <Rect x={330} y={190} width={16} height={22} rx={4} />
            <Rect x={330} y={238} width={16} height={22} rx={4} />
            <Rect x={330} y={286} width={16} height={22} rx={4} />
            <Rect x={330} y={334} width={16} height={22} rx={4} />
          </G>
          <Path d="M206 214 L232 300 L256 250 L280 300 L306 214" stroke="#7A3D49" strokeWidth={18} />
        </Svg>
      );

    case 'avatar':
      // Silhouette fallback in a warm-dark gradient disc
      return (
        <Svg viewBox="0 0 512 512" width={size} height={size} style={style}>
          <Defs>
            <ClipPath id="av-clip"><Circle cx={256} cy={256} r={150} /></ClipPath>
            <LinearGradient id="av-grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#241319" />
              <Stop offset="1" stopColor="#171015" />
            </LinearGradient>
          </Defs>
          <Circle cx={256} cy={256} r={150} fill="url(#av-grad)" stroke="#3A2A30" strokeWidth={10} />
          <G clipPath="url(#av-clip)" fill="#6B3540">
            <Circle cx={256} cy={222} r={58} />
            <Path d="M150 410 C150 332 200 300 256 300 C312 300 362 332 362 410 Z" />
          </G>
        </Svg>
      );

    case 'offline':
      // Disconnected cloud — no internet connection
      return (
        <Svg {...outline}>
          <Path d="M186 350 a72 72 0 0 1 6 -143 a92 92 0 0 1 176 22 a62 62 0 0 1 -14 121 Z" stroke="#E01E37" strokeWidth={16} />
          <Line x1={170} y1={158} x2={356} y2={372} stroke="#0A0A0B" strokeWidth={34} />
          <Line x1={170} y1={158} x2={356} y2={372} stroke="#A89098" strokeWidth={16} />
        </Svg>
      );

    case 'brand-mark':
      // WatchlistID monogram — red gradient tile with a white "W"
      return (
        <Svg viewBox="0 0 1024 1024" width={size} height={size} style={style}>
          <Defs>
            <LinearGradient id="bm-grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#E01E37" />
              <Stop offset="0.52" stopColor="#C71F37" />
              <Stop offset="1" stopColor="#641220" />
            </LinearGradient>
          </Defs>
          <Rect width={1024} height={1024} rx={232} fill="url(#bm-grad)" />
          <Path d="M280 332 L416 700 L512 470 L608 700 L744 332" fill="none" stroke="#F5F0F1" strokeWidth={84} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={512} cy={372} r={26} fill="#0A0A0B" opacity={0.32} />
        </Svg>
      );

    case 'google':
      // Google Sign-In — G with official blue (unchanged brand asset)
      if (size < 60) {
        return (
          <Svg viewBox="492 542 96 96" width={size} height={size} style={style}>
            <Circle cx={540} cy={590} r={48} fill="#FFFFFF" />
            <Path d="M576,590 L576,574 L554,574 L554,582 L567,582 Q565,596 554,601 Q545,606 535,604 Q520,600 516,587 Q512,574 520,564 Q528,554 542,554 Q552,554 558,560 L564,554 Q555,546 542,546 Q524,546 514,558 Q504,570 506,588 Q508,606 522,614 Q536,622 552,618 Q566,614 572,602 Q578,592 576,590 Z" fill="#4285F4" />
            <Rect x={554} y={582} width={22} height={8} fill="#4285F4" />
          </Svg>
        );
      }
      return (
        <Svg viewBox="459 509 162 162" width={size} height={size} style={style}>
          <Rect x={460} y={510} width={160} height={160} rx={20} fill="#111120" stroke="#1E1E2E" strokeWidth={1} />
          <Circle cx={540} cy={590} r={48} fill="#FFFFFF" />
          <Path d="M576,590 L576,574 L554,574 L554,582 L567,582 Q565,596 554,601 Q545,606 535,604 Q520,600 516,587 Q512,574 520,564 Q528,554 542,554 Q552,554 558,560 L564,554 Q555,546 542,546 Q524,546 514,558 Q504,570 506,588 Q508,606 522,614 Q536,622 552,618 Q566,614 572,602 Q578,592 576,590 Z" fill="#4285F4" />
          <Rect x={554} y={582} width={22} height={8} fill="#4285F4" />
        </Svg>
      );

    default:
      return null;
  }
};

export default EmptyStateIcon;
