import auth from '@react-native-firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import appleAuth from '@invertase/react-native-apple-authentication'
import * as Crypto from 'expo-crypto'
import { Platform } from 'react-native'

// ─── Setup ───────────────────────────────────────────────────────────────────
//
// Before this works you must:
//  1. Firebase Console → Authentication → Sign-in method → Enable Google
//  2. Re-download google-services.json and GoogleService-Info.plist
//  3. Replace WEB_CLIENT_ID below with the Web OAuth client ID shown in
//     Firebase Console → Authentication → Sign-in method → Google → Web SDK
//  4. Replace REPLACE_WITH_REVERSED_CLIENT_ID in app.json iosUrlScheme with
//     the reversed CLIENT_ID from the updated GoogleService-Info.plist
//  5. For Apple: Firebase Console → Authentication → Sign-in method → Apple
//     Add your bundle ID (com.differapps.intervaltimer) as a service ID
//
// ─────────────────────────────────────────────────────────────────────────────

const WEB_CLIENT_ID = '703339875432-2cj2ekf03t8u77fknmvni8odqbf77juq.apps.googleusercontent.com'

GoogleSignin.configure({
  webClientId:   WEB_CLIENT_ID,
  offlineAccess: true,
})

// ─── Google ───────────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<void> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
  const response = await GoogleSignin.signIn()
  const idToken  = response.data?.idToken
  if (!idToken) throw new Error('Google Sign-In returned no ID token')
  const credential = auth.GoogleAuthProvider.credential(idToken)
  await auth().signInWithCredential(credential)
}

// ─── Apple (iOS only) ────────────────────────────────────────────────────────

export function isAppleAuthAvailable(): boolean {
  return Platform.OS === 'ios' && appleAuth.isSupported
}

export async function signInWithApple(): Promise<void> {
  // Generate a cryptographic nonce — Apple signs it so Firebase can verify
  const rawNonce = Array.from(
    { length: 32 },
    () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
      Math.floor(Math.random() * 62)
    ],
  ).join('')

  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  )

  const response = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes:    [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    nonce:              hashedNonce,
  })

  if (!response.identityToken) throw new Error('Apple Sign-In returned no identity token')

  const credential = auth.AppleAuthProvider.credential(
    response.identityToken,
    rawNonce,
  )
  await auth().signInWithCredential(credential)
}

// ─── Email / Password ────────────────────────────────────────────────────────

export async function createAccountWithEmail(email: string, password: string): Promise<void> {
  await auth().createUserWithEmailAndPassword(email, password)
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await auth().signInWithEmailAndPassword(email, password)
}

export async function sendPasswordReset(email: string): Promise<void> {
  await auth().sendPasswordResetEmail(email)
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await auth().signOut()
  try {
    await GoogleSignin.revokeAccess()
    await GoogleSignin.signOut()
  } catch {
    // Google was not the sign-in provider — safe to ignore
  }
}
