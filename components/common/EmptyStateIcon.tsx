import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Rect, Circle, Path, Text as SvgText, Line, Polygon, Polyline, G } from 'react-native-svg';

export type EmptyStateIconName =
  | 'watchlist'
  | 'diary'
  | 'reviews'
  | 'search'
  | 'notifications'
  | 'avatar'
  | 'default-poster'
  | 'brand-mark'
  | 'google';

interface EmptyStateIconProps {
  name: EmptyStateIconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const EmptyStateIcon: React.FC<EmptyStateIconProps> = ({
  name,
  size = 96,
  style,
}) => {
  switch (name) {
    case 'watchlist':
      // 1. Watchlist — Empty screen + popcorn
      return (
        <Svg viewBox="59 61 162 162" width={size} height={size} style={style}>
          <Rect x="60" y="62" width="160" height="160" rx="20" fill="#111120" stroke="#1E1E2E" strokeWidth={1} />
          <Rect x="86" y="86" width="108" height="72" rx="6" fill="#0D0D14" stroke="#2A2A3E" strokeWidth={1.5} />
          <Rect x="130" y="158" width="20" height="8" rx="2" fill="#2A2A3E" />
          <Rect x="120" y="164" width="40" height="4" rx="2" fill="#2A2A3E" />
          <Circle cx="140" cy="122" r="10" fill="#1A1A2E" />
          <SvgText x="140" y="127" textAnchor="middle" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="12" fill="#2A2A3E">?</SvgText>
          <Path d="M100,185 L106,210 L134,210 L140,185 Z" fill="#B8922A" opacity={0.80} />
          <Rect x="100" y="182" width="40" height="6" rx="2" fill="#C9A84C" />
          <Circle cx="108" cy="178" r="5" fill="#F0EDE6" opacity={0.85} />
          <Circle cx="120" cy="172" r="5.5" fill="#F0EDE6" opacity={0.85} />
          <Circle cx="132" cy="178" r="5" fill="#F0EDE6" opacity={0.85} />
          <Circle cx="114" cy="171" r="4" fill="#F0EDE6" opacity={0.70} />
          <Circle cx="126" cy="168" r="4.5" fill="#F0EDE6" opacity={0.70} />
          <Rect x="110" y="216" width="60" height="1.5" rx="1" fill="#B8922A" opacity={0.40} />
        </Svg>
      );

    case 'diary':
      // 2. Diary — Calendar + film strip
      return (
        <Svg viewBox="259 61 162 162" width={size} height={size} style={style}>
          <Rect x="260" y="62" width="160" height="160" rx="20" fill="#111120" stroke="#1E1E2E" strokeWidth={1} />
          <Rect x="286" y="88" width="108" height="92" rx="6" fill="#0D0D14" stroke="#2A2A3E" strokeWidth={1.5} />
          <Rect x="286" y="88" width="108" height="22" rx="6" fill="#1A1A28" />
          <Rect x="286" y="98" width="108" height="12" fill="#1A1A28" />
          <Rect x="306" y="82" width="5" height="14" rx="2.5" fill="#B8922A" />
          <Rect x="369" y="82" width="5" height="14" rx="2.5" fill="#B8922A" />
          <SvgText x="340" y="104" textAnchor="middle" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="9" fill="#F0EDE6" opacity={0.50}>DIARY</SvgText>
          <Circle cx="302" cy="126" r="3" fill="#2A2A3E" />
          <Circle cx="320" cy="126" r="3" fill="#2A2A3E" />
          <Circle cx="338" cy="126" r="3" fill="#2A2A3E" />
          <Circle cx="356" cy="126" r="3" fill="#2A2A3E" />
          <Circle cx="374" cy="126" r="3" fill="#2A2A3E" />
          <Circle cx="302" cy="142" r="3" fill="#2A2A3E" />
          <Circle cx="320" cy="142" r="3" fill="#2A2A3E" />
          <Circle cx="338" cy="142" r="3" fill="#B8922A" />
          <Circle cx="356" cy="142" r="3" fill="#2A2A3E" />
          <Circle cx="374" cy="142" r="3" fill="#2A2A3E" />
          <Circle cx="302" cy="158" r="3" fill="#2A2A3E" />
          <Circle cx="320" cy="158" r="3" fill="#2A2A3E" />
          <Rect x="286" y="192" width="108" height="22" rx="4" fill="#1A1A28" stroke="#2A2A3E" strokeWidth={1} />
          <Rect x="290" y="196" width="10" height="14" rx="2" fill="#0D0D14" />
          <Rect x="304" y="196" width="10" height="14" rx="2" fill="#0D0D14" />
          <Rect x="318" y="196" width="10" height="14" rx="2" fill="#0D0D14" />
          <Rect x="332" y="196" width="10" height="14" rx="2" fill="#B8922A" opacity={0.60} />
          <Rect x="346" y="196" width="10" height="14" rx="2" fill="#0D0D14" />
          <Rect x="360" y="196" width="10" height="14" rx="2" fill="#0D0D14" />
          <Rect x="374" y="196" width="10" height="14" rx="2" fill="#0D0D14" />
          <Rect x="310" y="216" width="60" height="1.5" rx="1" fill="#B8922A" opacity={0.40} />
        </Svg>
      );

    case 'reviews':
      // 3. Reviews — Paper + stars + pencil
      return (
        <Svg viewBox="459 61 162 162" width={size} height={size} style={style}>
          <Rect x="460" y="62" width="160" height="160" rx="20" fill="#111120" stroke="#1E1E2E" strokeWidth={1} />
          <Rect x="490" y="84" width="80" height="100" rx="5" fill="#0D0D14" stroke="#2A2A3E" strokeWidth={1.5} />
          <Rect x="500" y="100" width="60" height="2" rx="1" fill="#2A2A3E" />
          <Rect x="500" y="112" width="50" height="2" rx="1" fill="#2A2A3E" />
          <Rect x="500" y="124" width="55" height="2" rx="1" fill="#2A2A3E" />
          <SvgText x="520" y="158" textAnchor="middle" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="16" fill="#B8922A">★★★</SvgText>
          <G rotation={-35} origin="543, 165">
            <Rect x="543" y="165" width="10" height="44" rx="3" fill="#C9A84C" />
            <Polygon points="543,196 553,196 548,210" fill="#F0EDE6" />
            <Rect x="543" y="165" width="10" height="6" rx="1" fill="#B8922A" />
          </G>
          <Rect x="510" y="216" width="60" height="1.5" rx="1" fill="#B8922A" opacity={0.40} />
        </Svg>
      );

    case 'search':
      // 4. Search — Magnifying glass + question mark
      return (
        <Svg viewBox="59 285 162 162" width={size} height={size} style={style}>
          <Rect x="60" y="286" width="160" height="160" rx="20" fill="#111120" stroke="#1E1E2E" strokeWidth={1} />
          <Circle cx="128" cy="344" r="34" fill="none" stroke="#2A2A3E" strokeWidth={8} />
          <Circle cx="128" cy="344" r="34" fill="none" stroke="#F0EDE6" strokeWidth={3} opacity={0.70} />
          <Line x1="153" y1="368" x2="172" y2="390" stroke="#F0EDE6" strokeWidth={6} strokeLinecap="round" opacity={0.70} />
          <SvgText x="128" y="352" textAnchor="middle" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="22" fontWeight="700" fill="#B8922A">?</SvgText>
          <Rect x="110" y="440" width="60" height="1.5" rx="1" fill="#B8922A" opacity={0.40} />
        </Svg>
      );

    case 'notifications':
      // 5. Notifications — Bell + ZZZ sleeping
      return (
        <Svg viewBox="259 285 162 162" width={size} height={size} style={style}>
          <Rect x="260" y="286" width="160" height="160" rx="20" fill="#111120" stroke="#1E1E2E" strokeWidth={1} />
          <Path d="M316,340 Q316,310 340,310 Q364,310 364,340 L368,380 L312,380 Z" fill="#1A1A28" stroke="#2A2A3E" strokeWidth={1.5} />
          <Circle cx="340" cy="308" r="5" fill="#2A2A3E" />
          <Path d="M326,380 Q326,394 340,394 Q354,394 354,380" fill="none" stroke="#2A2A3E" strokeWidth={3} strokeLinecap="round" />
          <Circle cx="340" cy="388" r="5" fill="#2A2A3E" />
          <SvgText x="366" y="328" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="11" fontWeight="700" fill="#B8922A" opacity={0.80}>Z</SvgText>
          <SvgText x="374" y="318" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="14" fontWeight="700" fill="#B8922A" opacity={0.60}>Z</SvgText>
          <SvgText x="384" y="306" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="17" fontWeight="700" fill="#B8922A" opacity={0.40}>Z</SvgText>
          <Rect x="310" y="440" width="60" height="1.5" rx="1" fill="#B8922A" opacity={0.40} />
        </Svg>
      );

    case 'avatar':
      // 6. Avatar — silhouette fallback (without the big round background if standalone, but inside a custom size)
      // Using viewBox covering the avatar inner area or full card. Let's make it the clean internal circle if size is small.
      if (size < 60) {
        return (
          <Svg viewBox="480 306 120 120" width={size} height={size} style={style}>
            <Circle cx="540" cy="366" r="56" fill="#1A1A28" stroke="#2A2A3E" strokeWidth={1.5} />
            <Circle cx="540" cy="340" r="22" fill="#2A2A3E" />
            <Path d="M500,420 Q500,390 540,390 Q580,390 580,420" fill="#2A2A3E" />
          </Svg>
        );
      }
      return (
        <Svg viewBox="459 285 162 162" width={size} height={size} style={style}>
          <Rect x="460" y="286" width="160" height="160" rx="20" fill="#111120" stroke="#1E1E2E" strokeWidth={1} />
          <Circle cx="540" cy="366" r="60" fill="#1A1A28" stroke="#2A2A3E" strokeWidth={1.5} />
          <Circle cx="540" cy="340" r="22" fill="#2A2A3E" />
          <Path d="M500,420 Q500,390 540,390 Q580,390 580,420" fill="#2A2A3E" />
          <Rect x="510" y="440" width="60" height="1.5" rx="1" fill="#B8922A" opacity={0.40} />
        </Svg>
      );

    case 'default-poster':
      // 7. Default Poster — Film frame + watermark W
      return (
        <Svg viewBox="73 509 134 182" width={size} height={size} style={style}>
          <Rect x="74" y="510" width="132" height="180" rx="8" fill="#111120" stroke="#1E1E2E" strokeWidth={1} />
          <Rect x="74" y="510" width="132" height="22" rx="8" fill="#0D0D14" />
          <Rect x="74" y="520" width="132" height="12" fill="#0D0D14" />
          <Rect x="82" y="514" width="10" height="10" rx="2" fill="#1A1A28" />
          <Rect x="98" y="514" width="10" height="10" rx="2" fill="#1A1A28" />
          <Rect x="114" y="514" width="10" height="10" rx="2" fill="#1A1A28" />
          <Rect x="130" y="514" width="10" height="10" rx="2" fill="#1A1A28" />
          <Rect x="146" y="514" width="10" height="10" rx="2" fill="#1A1A28" />
          <Rect x="162" y="514" width="10" height="10" rx="2" fill="#1A1A28" />
          <Rect x="178" y="514" width="10" height="10" rx="2" fill="#1A1A28" />
          {/* Faint W Watermark */}
          <Polyline points="110,580 120,630 130,600 140,618 150,600 160,630 170,580" fill="none" stroke="#F0EDE6" strokeWidth={6} opacity={0.08} strokeLinejoin="round" strokeLinecap="round" />
          <Rect x="96" y="594" width="88" height="58" rx="4" fill="none" stroke="#2A2A3E" strokeWidth={1.5} />
          <Circle cx="114" cy="612" r="6" fill="#2A2A3E" />
          <Polyline points="96,638 118,618 134,630 150,616 184,652" fill="none" stroke="#2A2A3E" strokeWidth={2} strokeLinejoin="round" />
          <Rect x="74" y="668" width="132" height="22" rx="0" fill="#0D0D14" />
          <Rect x="74" y="668" width="132" height="22" rx="8" fill="#0D0D14" />
          <Rect x="88" y="676" width="84" height="6" rx="3" fill="#2A2A3E" />
          <Rect x="110" y="688" width="40" height="1.5" rx="1" fill="#B8922A" opacity={0.40} />
        </Svg>
      );

    case 'brand-mark':
      // 8. Brand Mark — W in a double circle
      return (
        <Svg viewBox="259 509 162 162" width={size} height={size} style={style}>
          <Rect x="260" y="510" width="160" height="160" rx="20" fill="#111120" stroke="#1E1E2E" strokeWidth={1} />
          <Circle cx="340" cy="590" r="56" fill="#0D0D14" stroke="#2A2A3E" strokeWidth={1.5} />
          <Circle cx="340" cy="590" r="48" fill="none" stroke="#1A1A28" strokeWidth={1} />
          <Polyline points="306,564 320,622 332,584 340,604 348,584 360,622 374,564" fill="none" stroke="#F0EDE6" strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" />
          <Rect x="320" y="630" width="40" height="2" rx="1" fill="#B8922A" />
          <Rect x="310" y="666" width="60" height="1.5" rx="1" fill="#B8922A" opacity={0.40} />
        </Svg>
      );

    case 'google':
      // 9. Google Sign-In — G with official colors
      // If rendering inside a button (standalone G symbol), crop to the central white circle.
      if (size < 60) {
        return (
          <Svg viewBox="492 542 96 96" width={size} height={size} style={style}>
            <Circle cx="540" cy="590" r="48" fill="#FFFFFF" />
            <Path d="M576,590 L576,574 L554,574 L554,582 L567,582 Q565,596 554,601 Q545,606 535,604 Q520,600 516,587 Q512,574 520,564 Q528,554 542,554 Q552,554 558,560 L564,554 Q555,546 542,546 Q524,546 514,558 Q504,570 506,588 Q508,606 522,614 Q536,622 552,618 Q566,614 572,602 Q578,592 576,590 Z" fill="#4285F4" />
            <Rect x="554" y="582" width="22" height="8" fill="#4285F4" />
          </Svg>
        );
      }
      return (
        <Svg viewBox="459 509 162 162" width={size} height={size} style={style}>
          <Rect x="460" y="510" width="160" height="160" rx="20" fill="#111120" stroke="#1E1E2E" strokeWidth={1} />
          <Circle cx="540" cy="590" r="48" fill="#FFFFFF" />
          <Path d="M576,590 L576,574 L554,574 L554,582 L567,582 Q565,596 554,601 Q545,606 535,604 Q520,600 516,587 Q512,574 520,564 Q528,554 542,554 Q552,554 558,560 L564,554 Q555,546 542,546 Q524,546 514,558 Q504,570 506,588 Q508,606 522,614 Q536,622 552,618 Q566,614 572,602 Q578,592 576,590 Z" fill="#4285F4" />
          <Rect x="554" y="582" width="22" height="8" fill="#4285F4" />
          <Rect x="510" y="666" width="60" height="1.5" rx="1" fill="#B8922A" opacity={0.40} />
        </Svg>
      );

    default:
      return null;
  }
};

export default EmptyStateIcon;
