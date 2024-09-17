import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol, IonBackButton, IonButtons, IonText } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const AccountSetup: React.FC = () => {
  const history = useHistory();

  // State to store selected language, postal code, and flat/unit number
  const [language, setLanguage] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState<string>('');
  const [flatNo, setFlatNo] = useState<string>('');
  const storedPhoneNumber = localStorage.getItem('phoneNumber');

  // Error state for form validation and Firebase errors
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleContinue = async () => {
    // Validate form fields
    if (!language) {
      setErrorMessage('Please select a language.');
      return;
    }
    if (!postalCode.trim()) {
      setErrorMessage('Please enter your postal code.');
      return;
    }
    if (!flatNo.trim()) {
      setErrorMessage('Please enter your flat/unit number.');
      return;
    }

    // Check if storedPhoneNumber is available
    if (!storedPhoneNumber) {
      setErrorMessage('Phone number is missing. Please try again.');
      return;
    }

    // Clear any error messages
    setErrorMessage('');

    // Upload user data to Firestore
    try {
      await setDoc(doc(db, "users", storedPhoneNumber), {
        phoneNumber: storedPhoneNumber,
        language,
        postalCode,
        flatNo,
        requests: {},
        history: {}
      });
      console.log('User data uploaded successfully');
      
      // Proceed to the home page if successful
      history.push('/tabs/home');
    } catch (error) {
      // If an error occurs, display an error message and do not navigate to the home page
      setErrorMessage('Failed to register. Please try again.');
      console.error('Error uploading user data:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/register" />
          </IonButtons>
          <IonTitle>Select Language & Address</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Please choose a language</h2>

        {/* Display error message if any */}
        {errorMessage && (
          <IonText color="danger">
            <b><p>{errorMessage}</p></b>
          </IonText>
        )}

        <IonGrid>
          <IonRow>
            <IonCol>
              <IonButton
                expand="block"
                color={language === 'English' ? 'primary' : 'light'}
                onClick={() => setLanguage('English')}
              >
                English
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton
                expand="block"
                color={language === 'Chinese' ? 'primary' : 'light'}
                onClick={() => setLanguage('Chinese')}
              >
                华语
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton
                expand="block"
                color={language === 'Tamil' ? 'primary' : 'light'}
                onClick={() => setLanguage('Tamil')}
              >
                தமிழ்
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton
                expand="block"
                color={language === 'Malay' ? 'primary' : 'light'}
                onClick={() => setLanguage('Malay')}
              >
                Bahasa Melayu
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonItem>
          <IonInput
            value={postalCode}
            onIonChange={e => setPostalCode(e.detail.value!)}
            placeholder="Enter your postal code"
          />
        </IonItem>

        <IonItem>
          <IonInput
            value={flatNo}
            onIonChange={e => setFlatNo(e.detail.value!)}
            placeholder="Enter your flat/unit number"
          />
        </IonItem>

        <IonButton expand="block" onClick={handleContinue}>
          Continue
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default AccountSetup;
