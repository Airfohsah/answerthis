import { View, Pressable, StyleSheet } from 'react-native'
import { colors, radius } from '../theme'
import { mixColor } from '../theme/mixColor'

// The shared "3D" card treatment used everywhere a category/mode/stat needs
// its own accent color: a mostly-dark fill (just a hint of the color, not a
// bright wash), a thick vivid border, a drop shadow for a raised feel, and a
// diagonal accent stripe tucked in the bottom-left corner.
export default function TintedCard({ color, onPress, style, children }) {
  const Wrapper = onPress ? Pressable : View
  return (
    <Wrapper
      onPress={onPress}
      style={[styles.card, { backgroundColor: mixColor(colors.card, color, 0.06), borderColor: mixColor(colors.card, color, 0.5) }, style]}
    >
      <View style={[styles.swoosh, { backgroundColor: mixColor(colors.card, color, 0.7) }]} />
      {children}
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: radius.md,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  swoosh: {
    position: 'absolute',
    left: -22,
    bottom: -16,
    width: 90,
    height: 22,
    borderRadius: 11,
    opacity: 0.3,
    transform: [{ rotate: '-20deg' }],
  },
})
