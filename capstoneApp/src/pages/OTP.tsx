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
  IonText,
  IonAlert,
  IonBackButton,
  IonButtons,
  useIonViewWillEnter
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import axios from 'axios'

const Login: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const otpPhone = localStorage.getItem("otpPhone");

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [temppin, setTemppin] = useState<string>('');
  const [showOTPAlert, setShowOTPAlert] = useState<boolean>(false);  // State to show the alert

  // State to hold the values of each phone number digit
  const [OTPString, setOTPString] = useState<string[]>(new Array(4).fill(''));

  // Create refs for each input box
  const inputRefs = useRef<(HTMLIonInputElement | null)[]>(new Array(4).fill(null));

  const generateToken = () => {
    const randomNum = Math.random() * 9000;
    return (1000 + Math.floor(randomNum)).toString();
  };

  const sendOTP = async (token: string) => {

    console.log("OTP button pressed");

    try {
      
      const phoneNumber = "65" + otpPhone; // Use actual phone number
  
      // Make a request to the proxy server
      const response = await axios.get('', {
        params: {
          to: phoneNumber,
          otp: token
        }
      });

    } catch (error) {
      console.error('Error sending OTP:', error);
      setErrorMessage('Error sending OTP');
      return;
    }

  };  

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

      const updatedOTP = [...OTPString];
      if (OTPString[index] !== '') {
        updatedOTP[index] = '';
        setOTPString(updatedOTP);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.setFocus();
        updatedOTP[index - 1] = '';
        setOTPString(updatedOTP);
      }
    }
  };

  const handleVerification = async () => {
    if (OTPString.join('').length !== 4) {
      setErrorMessage('The OTP code is 4 digits long');
      return;
    }

    const OTPstr = OTPString.join('');

    if (OTPstr !== temppin) {
      setErrorMessage('The OTP pin entered is invalid');
      return;
    } else {
      const phoneNumber = localStorage.getItem('phoneNumberToLogin');
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

  const handleResendOTP = () => {
    sendOTP(temppin);
  };

  useIonViewWillEnter(() => {
    const token = generateToken();
    setTemppin(token);
    sendOTP(token);
  })

  useEffect(() => {
    if (location.pathname === "/otp") {
      setOTPString(new Array(4).fill(''));
      inputRefs.current[0]?.setFocus();
    }
  }, [location]);

  return (
    <IonPage>
      <IonHeader style={{ height: '10vh' }}>
        <IonToolbar color="primary" style={{ height: '10vh', lineHeight: '10vh' }}>
          <IonTitle>Verification</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/"/>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        <div className="welcomeText">
          <h1>Enter the OTP pin</h1>
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
          <IonText>
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

          <IonRow className="ion-justify-content-end">
            <IonCol size="auto">
              <IonButton color="tertiary" shape="round" onClick={handleResendOTP} style={{ fontSize: '16px', height: '50px' }}>
                Resend OTP
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* OTP Pop-up Alert */}
        <IonAlert
          isOpen={showOTPAlert}
          onDidDismiss={() => setShowOTPAlert(false)}
          header={'Your OTP Code'}
          message={`The OTP code is: ${temppin}`}
          buttons={['OK']}
        />

      </IonContent>
    </IonPage>
  );
};

export default Login;
