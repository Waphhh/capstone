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
  useIonViewWillEnter
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

import './Login.css';

const Login: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string[]>(new Array(8).fill(''));
  const inputRefs = useRef<(HTMLIonInputElement | null)[]>(new Array(8).fill(null));
  const [languageIndex, setLanguageIndex] = useState<number>(0);
  const [fade, setFade] = useState<boolean>(false);

  const translations = [
    'Sign in with your phone number by entering it below', // English
    '通过输入您的电话号码进行登录', // Chinese
    'Masuk dengan nombor telefon anda dengan memasukkannya di bawah', // Malay
    'உங்கள் தொலைபேசி எண்ணை கீழே உள்ளீடு செய்து உள்நுழையவும்' // Tamil
  ];

  const handleInputChange = (index: number, event: CustomEvent) => {
    const value = event.detail.value;
    if (value && /^\d$/.test(value)) {
      const updatedPhoneNumber = [...phoneNumber];
      updatedPhoneNumber[index] = value;
      setPhoneNumber(updatedPhoneNumber);
      if (index < inputRefs.current.length - 1) {
        inputRefs.current[index + 1]?.setFocus();
      }
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLIonInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const updatedPhoneNumber = [...phoneNumber];
      if (phoneNumber[index] !== '') {
        updatedPhoneNumber[index] = '';
        setPhoneNumber(updatedPhoneNumber);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.setFocus();
        updatedPhoneNumber[index - 1] = '';
        setPhoneNumber(updatedPhoneNumber);
      }
    }
  };

  const handleLogin = async () => {
    if (phoneNumber.join('').length !== 8) {
      setErrorMessage('A phone number requires 8 digits');
      return;
    }
    const phoneNumberStr = phoneNumber.join('');
    localStorage.setItem('otpPhone', phoneNumberStr);
    try {
      const userDocRef = doc(db, 'users', phoneNumberStr);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        localStorage.setItem('phoneNumberToLogin', phoneNumberStr);
        history.push('/otp');
      } else {
        localStorage.setItem('phoneNumberToRegister', phoneNumberStr);
        history.push('/otp');
      }
    } catch (error) {
      console.error("Error checking phone number:", error);
      setErrorMessage('An error occurred. Please try again.');
    }
  };

  useIonViewWillEnter(() => {
    localStorage.clear();
  });

  useEffect(() => {
    setPhoneNumber(new Array(8).fill(''));
  }, [location]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setLanguageIndex((prevIndex) => (prevIndex + 1) % translations.length);
        setFade(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <IonPage>
      <IonHeader style={{ height: '10vh' }}>
        <IonToolbar color="primary" style={{ height: '10vh', lineHeight: '10vh' }}>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className={`translation-text ${fade ? 'fade' : ''}`} 
            style={{ fontSize: translations[languageIndex].length > 40 ? '1.6em' : '2.2em' }}>
          {translations[languageIndex]}
        </div>

        <IonGrid>
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
          <IonText>
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
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Login;
