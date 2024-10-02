import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebaseConfig'; // adjust import path
import { IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom'; // Import useHistory

const Admin: React.FC = () => {
  const provider = new GoogleAuthProvider();
  const history = useHistory();

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      console.log(token);
      const user = result.user;
      console.log("Google Auth Token:", token);
      console.log("Authenticated User:", user);
      
      // Redirect to the requests page
      history.push("/requests");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  return (
    <div>
      <h1>Admin Page</h1>
      <IonButton onClick={signInWithGoogle}>Sign in with Google</IonButton>
    </div>
  );
};

export default Admin;
