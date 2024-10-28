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

const Login: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const [errorMessage, setErrorMessage] = useState<string>('');

  // State to hold the values of each phone number digit
  const [phoneNumber, setPhoneNumber] = useState<string[]>(new Array(8).fill(''));

  // Create refs for each input box
  const inputRefs = useRef<(HTMLIonInputElement | null)[]>(new Array(8).fill(null));

  // State for language toggle
  const [languageIndex, setLanguageIndex] = useState<number>(0);
  
  // Translations for the header message
  const translations = [
    'Sign in with your phone number by entering it below', // English
    '通过输入您的电话号码进行登录', // Chinese
    'Masuk dengan nombor telefon anda dengan memasukkannya di bawah', // Malay
    'உங்கள் தொலைபேசி எண்ணை கீழே உள்ளீடு செய்து உள்நுழையவும்' // Tamil
  ];

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

  const handleLogin = async () => {
    if (phoneNumber.join('').length !== 8) {
      setErrorMessage('A phone number requires 8 digits');
      return;
    }

    const phoneNumberStr = phoneNumber.join('');

    try {
      const userDocRef = doc(db, 'users', phoneNumberStr); // Reference to the document with the phone number
      const userDoc = await getDoc(userDocRef); // Check if the document exists
      if (userDoc.exists()) {
        // Phone number exists, proceed with login
        localStorage.setItem('phoneNumberToLogin', phoneNumberStr);
        history.push('/otp');
      } else {
        // Phone number does not exist, set error message
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

  // Interval to change language every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLanguageIndex((prevIndex) => (prevIndex + 1) % translations.length);
    }, 5000); // Change language every 5 seconds

    return () => clearInterval(interval); // Clear the interval on component unmount
  }, []);

  return (
    <IonPage>
      <IonHeader style={{ height: '10vh' }}>
        <IonToolbar color="primary" style={{ height: '10vh', lineHeight: '10vh' }}>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        <div style={{ textAlign: 'center' }}>
          <h1>{translations[languageIndex]}</h1>
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
