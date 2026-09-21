import { View, StyleSheet } from 'react-native'
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons'

// `set` picks which vector-icon family a catalog entry's `icon` name belongs
// to -- kept as one switch here so every screen renders badges identically.
export function Icon({ set, name, size = 20, color }) {
  if (set === 'mci') return <MaterialCommunityIcons name={name} size={size} color={color} />
  if (set === 'fa5') return <FontAwesome5 name={name} size={size * 0.85} color={color} />
  return <Ionicons name={name} size={size} color={color} />
}

export function Badge({ set, icon, color, size = 44, iconSize = 22, style }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '2A' }, style]}>
      <Icon set={set} name={icon} size={iconSize} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
})
