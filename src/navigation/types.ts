import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type TabParamList = {
  Library:  undefined
  Create:   undefined
  History:  undefined
  Settings: undefined
}

export type RootStackParamList = {
  Tabs:           NavigatorScreenParams<TabParamList>
  ActiveWorkout:  { workoutId: string }
  WorkoutBuilder: {
    workoutId?: string
    duplicateFromId?: string
    duplicateName?: string
  }
}

export type LibraryNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Library'>,
  NativeStackNavigationProp<RootStackParamList>
>

export type CreateNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Create'>,
  NativeStackNavigationProp<RootStackParamList>
>
