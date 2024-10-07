import React, { useState, useRef } from 'react';
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
import { useHistory } from 'react-router-dom';

import './Register.css';

const Register: React.FC = () => {
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

  const register1 = () => {
    let phoneNumberToRegister = phoneNumber.join('')
    if (phoneNumberToRegister.length != 8) {
      setErrorMessage('A phone number requires 8 digits');
      return;
    }
    
    localStorage.setItem('phoneNumber', phoneNumber.join(''));
    console.log('Register button clicked' + phoneNumberToRegister);
    history.push('/tabs/accoutSetup');
    // Add your register logic here
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {errorMessage && (
          <IonText color="danger">
            <b><p>{errorMessage}</p></b>
          </IonText>
        )}

        <div className="welcomeText">
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
                    border: '1px solid #ccc',
                    padding: '10px',
                    borderRadius: '5px'
                  }}
                />
              </IonCol>
            ))}
          </IonRow>

          <IonRow>
            <IonCol>
              <IonButton expand="block" fill="outline" color="secondary" onClick={register1} style={{ fontSize: '28px', height: '70px' }}>
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
