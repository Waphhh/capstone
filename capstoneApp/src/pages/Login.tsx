import React, { useState, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonText
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

const Login: React.FC = () => {
  const history = useHistory();
  const [errorMessage, setErrorMessage] = useState<string>('');

  // State to hold the values of each phone number digit
  const [phoneNumber, setPhoneNumber] = useState<string[]>(new Array(8).fill(''));

  // Create refs for each input box
  const inputRefs = useRef<(HTMLIonInputElement | null)[]>(new Array(8).fill(null));

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

  const handleLogin = () => {
    if (phoneNumber.join('').length != 8) {
      setErrorMessage('A phone number requires 8 digits');
      return;
    }

    console.log("test");
    localStorage.setItem('phoneNumber', phoneNumber.join(''));
    history.push('/tabs/home');
  };  

  const handleRegister = () => {
    console.log('Register button clicked');
    history.push('/tabs/register');
    // Add your register logic here
  };

  return (
    <IonPage>
      <IonHeader style={{ height: '10vh' }}>
        <IonToolbar color="danger" style={{ height: '10vh', lineHeight: '10vh' }}>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        <div className="welcomeText">
          <h1>Sign in with your phone number by entering it below</h1>
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

          {errorMessage && (
          <IonText color="danger">
            <b><p>{errorMessage}</p></b>
          </IonText>
          )}

          <IonRow>
            <IonCol>
              <IonButton expand="block" color="primary" shape="round" onClick={handleLogin} style={{ fontSize: '28px', height: '70px' }}>
                Login
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol style={{ textAlign: 'center' }}>
              <IonText style={{ fontSize: '23px' }}>
                Don't have an account?{' '}
                <span style={{ color: '#3880ff', cursor: 'pointer' }} onClick={handleRegister}>
                  Sign up
                </span>
              </IonText>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Login;
