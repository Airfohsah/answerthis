import { Pressable, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, fonts } from '../theme'

const VARIANTS = {
  gold: { bg: colors.gold, fg: '#000' },
  outline: { bg: 'transparent', fg: colors.text2, border: colors.border },
  red: { bg: 'rgba(231,76,60,0.15)', fg: colors.red, border: 'rgba(231,76,60,0.3)' },
  green: { bg: 'rgba(46,204,113,0.15)', fg: colors.green, border: 'rgba(46,204,113,0.3)' },
}

export default function Button({ title, onPress, variant = 'gold', disabled, style, icon }) {
  const v = VARIANTS[variant] || VARIANTS.gold
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border || 'transparent', opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={16} color={v.fg} style={styles.icon} />}
      <Text style={[styles.text, { color: v.fg }]}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { marginRight: 8 },
  text: {
    fontFamily: fonts.displaySemibold,
    fontSize: 15,
  },
})
