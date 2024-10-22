import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonButtons,
  IonBackButton,
  IonText
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const Register: React.FC = () => {
  const location = useLocation();

  const history = useHistory();

  // State to hold the values of each phone number digit
  const [phoneNumber, setPhoneNumber] = useState<string[]>(new Array(8).fill(''));

  // Create refs for each input box
  const inputRefs = useRef<(HTMLIonInputElement | null)[]>(new Array(8).fill(null));

  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleInputChange = (index: number, event: CustomEvent) => {
    const value = event.detail.value;

    // Only allow numeric input
    if (value && /^\d$/.test(value)) {
      const updatedPhoneNumber = [...phoneNumber];
      updatedPhoneNumber[index] = value;
      setPhoneNumber(updatedPhoneNumber);

      // Move focus to the next input field if it exists
      if (index < inputRefs.current.length - 1) {
        inputRefs.current[index + 1]?.setFocus();
      }
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLIonInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault(); // Prevent default backspace behavior

      // Handle clearing the current input box
      const updatedPhoneNumber = [...phoneNumber];
      if (phoneNumber[index] !== '') {
        // Clear the current input if it's not already empty
        updatedPhoneNumber[index] = '';
        setPhoneNumber(updatedPhoneNumber);
      } else if (index > 0) {
        // If the current input is already empty, move back to the previous input
        inputRefs.current[index - 1]?.setFocus();

        // Clear the previous input
        updatedPhoneNumber[index - 1] = '';
        setPhoneNumber(updatedPhoneNumber);
      }
    }
  };

  const register1 = async () => {
    let phoneNumberToRegister = phoneNumber.join('')
    if (phoneNumberToRegister.length != 8) {
      setErrorMessage('A phone number requires 8 digits');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', phoneNumberToRegister); // Reference to the document with the phone number
      const userDoc = await getDoc(userDocRef); // Check if the document exists
      if (userDoc.exists()) {
        // Phone number exists, proceed with login
        setErrorMessage('Your account has already been registered, please login.');
        return;
      }
    } catch (error) {
      console.error("Error checking phone number:", error);
      setErrorMessage('An error occurred. Please try again.');
      return;
    }
    
    localStorage.setItem('phoneNumberToRegister', phoneNumber.join(''));
    console.log('Register button clicked' + phoneNumberToRegister);
    history.push('/otp');
    // Add your register logic here
  };

  useEffect(() => {
    // Clear the OTP fields when the page is loaded
    setPhoneNumber(new Array(8).fill(''));
  }, [location]);

  return (
    <IonPage>
      <IonHeader style={{ height: '10vh' }}>
        <IonToolbar color="primary" style={{ height: '10vh', lineHeight: '10vh' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        {errorMessage && (
          <IonText>
            <b><p>{errorMessage}</p></b>
          </IonText>
        )}

        <div style={{ textAlign: 'center' }}>
          <h1>Sign up with your phone number by entering it below</h1>
        </div>

        <IonGrid>
          {/* 8 Input boxes for the phone number */}
          <IonRow className="ion-justify-content-center">
            {phoneNumber.map((digit, index) => (
              <IonCol size="1.5" key={index}>
                <IonInput
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="tel"
                  maxlength={1}
                  inputmode="numeric"
                  value={digit}
                  onIonInput={(e) => handleInputChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={{
                    textAlign: 'center',
                    fontSize: '2em',
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#e3e3e8'
                  }}
                />
              </IonCol>
            ))}
          </IonRow>

          <IonRow style ={{paddingTop: '15px'}}>
            <IonCol>
              <IonButton expand="block" shape="round" color="primary" onClick={register1} style={{ fontSize: '28px', height: '50px' }}>
                Register
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Register;
