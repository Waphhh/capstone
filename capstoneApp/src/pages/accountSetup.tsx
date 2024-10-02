import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol, IonBackButton, IonButtons, IonText, IonCheckbox, IonModal } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const AccountSetup: React.FC = () => {
  const history = useHistory();

  // State to store selected language, postal code, flat/unit number, and T&C checkbox
  const [language, setLanguage] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState<string>('');
  const [flatNo, setFlatNo] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);  // New state for T&C acceptance
  const [showModal, setShowModal] = useState<boolean>(false);  // State to control the modal visibility
  const storedPhoneNumber = localStorage.getItem('phoneNumber');

  // Error state for form validation and Firebase errors
  const [errorMessage, setErrorMessage] = useState<string>('');

  function containsOnlyDigits(str) {
    return /^\d+$/.test(str);
  }

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
    if (!(containsOnlyDigits(postalCode))) {
      setErrorMessage('A postal code can only contain digits');
      return;
    }
    if (postalCode.length !== 6) {
      setErrorMessage('A postal code is 6 digits long');
      return;
    }
    if (!flatNo.trim()) {
      setErrorMessage('Please enter your flat/unit number.');
      return;
    }
    if (!acceptedTerms) {  // Check if the user has accepted the T&Cs
      setErrorMessage('Please accept the Terms & Conditions.');
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
        history: {},
        favorites: [],
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
            <IonBackButton defaultHref="/tabs/register" />
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

        {/* Postal Code and Flat No input fields */}
        <IonItem style={{ paddingRight: '16px' }}>
          <IonInput
            value={postalCode}
            onIonInput={e => setPostalCode(e.detail.value!)}
            placeholder="Enter your postal code"
          />
        </IonItem>

        <IonItem style={{ paddingRight: '16px' }}>
          <IonInput
            value={flatNo}
            onIonInput={e => setFlatNo(e.detail.value!)}
            placeholder="Enter your flat/unit number"
          />
        </IonItem>

        {/* T&C Checkbox and link */}
        <IonItem lines="none">
          <IonCheckbox
            slot="start"
            checked={acceptedTerms}
            onIonChange={e => setAcceptedTerms(e.detail.checked!)}
          />
          <IonLabel style={{ display: 'inline', marginLeft: '0' }}>
            I accept the{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowModal(true); // Show the modal when T&Cs link is clicked
              }}
            >
              Terms & Conditions
            </a>
          </IonLabel>
        </IonItem>

        {/* Continue button */}
        <IonButton expand="block" onClick={handleContinue}>
          Continue
        </IonButton>

        {/* Modal for Terms & Conditions */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Terms & Conditions</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {/* Embed T&Cs content from the external link */}
            <iframe
              src="https://www.youthbank.sg/privacypolicy"
              title="Terms & Conditions"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            ></iframe>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AccountSetup;
