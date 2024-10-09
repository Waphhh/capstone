import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebaseConfig'; // adjust import path
import { IonButton, IonContent, IonPage, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Admin.css'; // Import custom styles

const Admin: React.FC = () => {
  const provider = new GoogleAuthProvider();
  const history = useHistory();

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      console.log("Google Auth Token:", token);
      console.log("Authenticated User:", result.user);
      
      history.push("/requests");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="admin-container">
          <h2>Welcome to the Admin Panel</h2>
          <p>Sign in with Google to access the admin features.</p>
          <IonButton expand="block" color="primary" onClick={signInWithGoogle}>
            Sign in with Google
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Admin;
