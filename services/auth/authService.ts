import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  type User,
  type UserCredential,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

// Types
export interface AuthError {
  code: string
  message: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface ProfileUpdateData {
  displayName?: string
  photoURL?: string
}

// Helper function to get user-friendly error messages
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "Este correo electrónico ya está en uso. Por favor, utiliza otro."
    case "auth/invalid-email":
      return "El correo electrónico no es válido."
    case "auth/user-disabled":
      return "Esta cuenta ha sido deshabilitada."
    case "auth/user-not-found":
      return "No existe una cuenta con este correo electrónico."
    case "auth/wrong-password":
      return "Contraseña incorrecta."
    case "auth/weak-password":
      return "La contraseña es demasiado débil. Debe tener al menos 6 caracteres."
    case "auth/invalid-credential":
      return "Credenciales inválidas. Por favor, verifica tu correo y contraseña."
    case "auth/too-many-requests":
      return "Demasiados intentos fallidos. Por favor, intenta más tarde."
    case "auth/network-request-failed":
      return "Error de conexión. Verifica tu conexión a internet."
    case "auth/popup-closed-by-user":
      return "Inicio de sesión cancelado. La ventana fue cerrada."
    case "auth/operation-not-allowed":
      return "Esta operación no está permitida."
    case "auth/account-exists-with-different-credential":
      return "Ya existe una cuenta con este correo pero con diferentes credenciales."
    default:
      return "Ocurrió un error. Por favor, intenta de nuevo."
  }
}

// Create an authService object with all the functions
export const authService = {
  // Register a new user
  registerUser: async (data: RegisterData): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)

      // Update profile with name
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, {
          displayName: data.name,
        })

        // Create user profile with signup bonus if not exists
        try {
          const profileRef = doc(db, "userProfiles", userCredential.user.uid)
          const snap = await getDoc(profileRef)
          if (!snap.exists()) {
            await setDoc(profileRef, {
              uid: userCredential.user.uid,
              email: data.email,
              displayName: data.name,
              points: 500,
              provider: 'password',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          }
        } catch (e) {
          // Non-blocking: profile creation failures shouldn't fail auth
          console.error("Failed to create user profile with bonus:", e)
        }
      }

      return userCredential.user
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || "unknown",
        message: getErrorMessage(error.code) || error.message,
      }
      throw authError
    }
  },

  // Login with email and password
  loginWithEmail: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      // Ensure user profile exists (older accounts)
      try {
        const u = userCredential.user
        const profileRef = doc(db, "userProfiles", u.uid)
        const snap = await getDoc(profileRef)
        if (!snap.exists()) {
          await setDoc(profileRef, {
            uid: u.uid,
            email: email,
            displayName: u.displayName || "",
            points: 500,
            provider: 'password',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }
      } catch (e) {
        console.error("Failed to ensure user profile (email login):", e)
      }
      return userCredential.user
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || "unknown",
        message: getErrorMessage(error.code) || error.message,
      }
      throw authError
    }
  },

  // Login with Google
  loginWithGoogle: async (): Promise<UserCredential> => {
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      try {
        const u = cred.user
        const profileRef = doc(db, "userProfiles", u.uid)
        const snap = await getDoc(profileRef)
        if (!snap.exists()) {
          await setDoc(profileRef, {
            uid: u.uid,
            email: u.email || "",
            displayName: u.displayName || "",
            points: 500,
            provider: 'google',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }
      } catch (e) {
        console.error("Failed to ensure user profile (Google):", e)
      }
      return cred
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || "unknown",
        message: getErrorMessage(error.code) || error.message,
      }
      throw authError
    }
  },

  // Login with Facebook
  loginWithFacebook: async (): Promise<UserCredential> => {
    try {
      const provider = new FacebookAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      try {
        const u = cred.user
        const profileRef = doc(db, "userProfiles", u.uid)
        const snap = await getDoc(profileRef)
        if (!snap.exists()) {
          await setDoc(profileRef, {
            uid: u.uid,
            email: u.email || "",
            displayName: u.displayName || "",
            points: 500,
            provider: 'facebook',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }
      } catch (e) {
        console.error("Failed to ensure user profile (Facebook):", e)
      }
      return cred
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || "unknown",
        message: getErrorMessage(error.code) || error.message,
      }
      throw authError
    }
  },

  // Logout
  signOut: async (): Promise<void> => {
    return await firebaseSignOut(auth)
  },

  // Send password reset email
  sendPasswordReset: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || "unknown",
        message: getErrorMessage(error.code) || error.message,
      }
      throw authError
    }
  },

  // Confirm password reset
  resetPassword: async (oobCode: string, newPassword: string): Promise<void> => {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || "unknown",
        message: getErrorMessage(error.code) || error.message,
      }
      throw authError
    }
  },

  // Update user profile
  updateProfile: async (data: ProfileUpdateData): Promise<void> => {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error("No user is currently signed in")
      }
      await firebaseUpdateProfile(user, data)
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || "unknown",
        message: getErrorMessage(error.code) || error.message,
      }
      throw authError
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return auth.currentUser
  },

  // Helper function to get error messages
  getErrorMessage,
}

// For backward compatibility, also export individual functions
export const registerUser = authService.registerUser
export const loginWithEmail = authService.loginWithEmail
export const loginWithGoogle = authService.loginWithGoogle
export const loginWithFacebook = authService.loginWithFacebook
export const signOut = authService.signOut
export const sendPasswordReset = authService.sendPasswordReset
export const resetPassword = authService.resetPassword
export const getCurrentUser = authService.getCurrentUser
export { getErrorMessage }
