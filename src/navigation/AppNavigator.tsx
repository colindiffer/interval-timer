import React from 'react'
import { StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Svg, { Path, Circle } from 'react-native-svg'

import { useColors, useTheme } from '../theme'
import { RootStackParamList, TabParamList } from './types'

import CreateScreen         from '../screens/CreateScreen'
import LibraryScreen        from '../screens/LibraryScreen'
import HistoryScreen        from '../screens/HistoryScreen'
import SettingsScreen       from '../screens/SettingsScreen'
import ActiveWorkoutScreen  from '../screens/ActiveWorkoutScreen'
import WorkoutBuilderScreen from '../screens/WorkoutBuilderScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab   = createBottomTabNavigator<TabParamList>()

function IconLibrary({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 10h16M4 14h10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={19} cy={14} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
  )
}

function IconCreate({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

function IconHistory({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function IconSettings({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  )
}

function Tabs() {
  const C = useColors()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color }) => {
          if (route.name === 'Library')  return <IconLibrary color={color} />
          if (route.name === 'Create')   return <IconCreate color={color} />
          if (route.name === 'History')  return <IconHistory color={color} />
          if (route.name === 'Settings') return <IconSettings color={color} />
          return null
        },
        tabBarStyle: {
          backgroundColor: C.bgCard,
          borderTopColor:  C.border,
          borderTopWidth:  0.5,
          height:          80,
          paddingBottom:   16,
          paddingTop:      8,
        },
        tabBarActiveTintColor:   C.accent,
        tabBarInactiveTintColor: C.textSecondary,
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '500',
          marginTop:  2,
        },
      })}
    >
      <Tab.Screen name="Library"  component={LibraryScreen}  />
      <Tab.Screen name="Create"   component={CreateScreen}   />
      <Tab.Screen name="History"  component={HistoryScreen}  />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const C = useColors()
  const { theme } = useTheme()
  return (
    <NavigationContainer
      theme={{
        dark: theme === 'dark',
        colors: {
          primary:      C.accent,
          background:   C.bg,
          card:         C.bgCard,
          text:         C.textPrimary,
          border:       C.border,
          notification: C.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium:  { fontFamily: 'System', fontWeight: '500' },
          bold:    { fontFamily: 'System', fontWeight: '700' },
          heavy:   { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen
          name="ActiveWorkout"
          component={ActiveWorkoutScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="WorkoutBuilder"
          component={WorkoutBuilderScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({})
