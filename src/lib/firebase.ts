import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Configurer le fournisseur Google pour forcer la sélection du compte
googleAuthProvider.setCustomParameters({
  prompt: "select_account"
});

export { signInWithPopup };
