import { View, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle, Path, Polygon } from 'react-native-svg'
import { colors } from '../theme'

// Fixed decorative landscape sitting behind every screen's content -- same
// composition idea as a painted sunset/mountain background (gradient sky,
// glowing sun, layered mountain silhouettes, a lake reflection, corner
// foliage) but built as flat vector shapes in the app's own gold-on-black
// palette instead of a painted illustration. The whole scene is compressed
// into the top of the viewBox and anchored there (xMidYMin, not YMid) so it
// reliably sits behind the header/hero area on any phone aspect ratio
// instead of drifting into the middle of scrollable content, and everything
// fades to flat colors.bg well before the bottom so lists stay readable.
export default function AppBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMin slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.bg} />
            <Stop offset="0.3" stopColor="#140d08" />
            <Stop offset="0.55" stopColor="#2a1a0c" />
            <Stop offset="1" stopColor={colors.bg} />
          </LinearGradient>
          <RadialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={colors.gold} stopOpacity="0.35" />
            <Stop offset="1" stopColor={colors.gold} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="reflection" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.gold} stopOpacity="0.18" />
            <Stop offset="1" stopColor={colors.gold} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="fadeOut" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.bg} stopOpacity="0" />
            <Stop offset="1" stopColor={colors.bg} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="400" height="420" fill="url(#sky)" />

        {/* sun + glow, small and subdued -- an accent, not a focal point */}
        <Circle cx="260" cy="150" r="55" fill="url(#sunGlow)" />
        <Circle cx="260" cy="150" r="18" fill={colors.gold} opacity="0.55" />

        {/* mountain layers, back to front, compressed near the top */}
        <Polygon points="0,190 60,150 130,180 200,135 270,175 340,145 400,180 400,220 0,220" fill={colors.bg3} opacity="0.4" />
        <Polygon points="0,215 90,165 160,195 240,155 320,200 400,170 400,250 0,250" fill={colors.bg2} opacity="0.55" />
        <Polygon points="0,245 70,205 150,235 220,195 300,240 400,205 400,280 0,280" fill={colors.bg} opacity="0.85" />

        {/* lake + reflection */}
        <Rect x="0" y="280" width="400" height="50" fill={colors.bg2} opacity="0.3" />
        <Rect x="215" y="280" width="90" height="50" fill="url(#reflection)" />

        {/* corner foliage, kept low-key */}
        <Path
          d="M0,420 L0,340 C15,353 27,330 35,345 C43,322 55,352 47,368 C67,360 71,390 55,398 C40,386 24,405 0,390 Z"
          fill={colors.bg2}
          opacity="0.5"
        />
        <Path
          d="M400,420 L400,345 C386,357 378,335 368,347 C362,328 348,352 356,368 C338,360 332,388 348,398 C364,387 378,403 400,393 Z"
          fill={colors.bg2}
          opacity="0.5"
        />

        {/* fade everything below the scene to flat background */}
        <Rect x="0" y="320" width="400" height="120" fill="url(#fadeOut)" />
      </Svg>
    </View>
  )
}
