import firebase from '@react-native-firebase/app'
import analytics from '@react-native-firebase/analytics'
import firestore from '@react-native-firebase/firestore'
import auth from '@react-native-firebase/auth'

// @react-native-firebase initialises automatically from
// google-services.json (Android) and GoogleService-Info.plist (iOS).
// No manual initializeApp() call needed.

export { firebase, analytics, firestore, auth }
