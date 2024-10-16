import React, { useState, useRef, useEffect } from 'react';
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
import axios from 'axios'
import OneWaySMS from './onewaysms'

const Login: React.FC = () => {
  const history = useHistory();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [temppin, setTemppin] = useState<string>('');

  // State to hold the values of each phone number digit
  const [OTPString, setOTPString] = useState<string[]>(new Array(4).fill(''));

  // Create refs for each input box
  const inputRefs = useRef<(HTMLIonInputElement | null)[]>(new Array(4).fill(null));

  const generateToken = () => {
    const randomNum = Math.random() * 9000;
    return (1000 + Math.floor(randomNum)).toString();
  };

  // const sendOTP = async () => {

  //   console.log("OTP button pressed");

  //   try {
  //     const phoneNumber = '6586294102'; // Use actual phone number
  //     const message = 'Your OTP code is 1234';
  
  //     // Make a request to the proxy server
  //     const response = await axios.get('http://localhost:3001/send-sms', {
  //       params: {
  //         to: phoneNumber,
  //         message: message
  //       }
  //     });
  
  //     console.log(response.data);
  //   } catch (error) {
  //     console.error('Error sending OTP:', error);
  //   }
  

    
  //   // sms.send(payload, handleResult);  
  //   // sms.status('2410160005134', handleResult);
  //   // sms.balance(handleResult);

  // };

  const handleInputChange = (index: number, event: CustomEvent) => {
    const value = event.detail.value;

    // Only allow numeric input
    if (value && /^\d$/.test(value)) {
      const updatedOTP = [...OTPString];
      updatedOTP[index] = value;
      setOTPString(updatedOTP);

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
      const updatedOTP = [...OTPString];
      if (OTPString[index] !== '') {
        // Clear the current input if it's not already empty
        updatedOTP[index] = '';
        setOTPString(updatedOTP);
      } else if (index > 0) {
        // If the current input is already empty, move back to the previous input
        inputRefs.current[index - 1]?.setFocus();

        // Clear the previous input
        updatedOTP[index - 1] = '';
        setOTPString(updatedOTP);
      }
    }
  };

  const handleVerification = async () => {
    if (OTPString.join('').length != 4) {
      setErrorMessage('The OTP code is 4 digits long');
      return;
    }

    const OTPstr = OTPString.join('')

    if (OTPstr !== temppin) {
      setErrorMessage('The OTP pin entered is invalid');
      return;
    } else {
      const phoneNumber = localStorage.getItem('phoneNumberToLogin');
      console.log(phoneNumber);
      if (phoneNumber) {
        history.push('/tabs/home');
        localStorage.removeItem('phoneNumberToLogin');
        localStorage.setItem('phoneNumber', phoneNumber);
      } else {
        history.push('/tabs/accountsetup');
        const phoneNumberRegister = localStorage.getItem('phoneNumberToRegister');
        localStorage.removeItem('phoneNumberToRegister');
        localStorage.setItem('phoneNumber', phoneNumberRegister);
      }
    }
  };

  useEffect(() => {
    console.log(temppin);
  }, [temppin]);

  useEffect(() => {
    // Clear the OTP fields when the page is loaded
    setOTPString(new Array(4).fill(''));

    // Focus the first input field when the page is loaded
    inputRefs.current[0]?.setFocus();

    setTemppin(generateToken);

  }, []);

  return (
    <IonPage>
      <IonHeader style={{ height: '10vh' }}>
        <IonToolbar color="danger" style={{ height: '10vh', lineHeight: '10vh' }}>
          <IonTitle>Verification</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        <div className="welcomeText">
          <h1>Enter in the OTP pin</h1>
        </div>

        <IonGrid>
          
          {/* 4 Input boxes for the OTP */}
          <IonRow className="ion-justify-content-center">
            {OTPString.map((digit, index) => (
              <IonCol size="3" key={index}>
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
              <IonButton expand="block" color="primary" shape="round" onClick={handleVerification} style={{ fontSize: '28px', height: '70px' }}>
                Confirm
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

      </IonContent>
    </IonPage>
  );
};

export default Login;
