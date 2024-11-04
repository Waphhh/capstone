import React, { useState, useRef, useEffect } from 'react';  // Import useRef
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol, IonBackButton, IonButtons, IonText, IonCheckbox, IonModal, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { closeOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

const AccountSetup: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const contentRef = useRef<HTMLIonContentElement>(null);  // Create a ref for IonContent

  const [language, setLanguage] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState<string>('');
  const [flatNo, setFlatNo] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const [errorMessage, setErrorMessage] = useState<string>('');

  function containsOnlyDigits(str: string) {
    return /^\d+$/.test(str);
  }

  const handleContinue = async () => {
    const flatparts = flatNo.trim().split("-");
    if (flatparts.length !== 2) {
      setErrorMessage(t('Please enter your unit number in the format XX-XX.'));
      return;
    }

    if (!language) {
      setErrorMessage(t('Please select a language.'));
      return;
    }
    if (!postalCode.trim()) {
      setErrorMessage(t('Please enter your postal code.'));
      return;
    }
    if (!(containsOnlyDigits(postalCode))) {
      setErrorMessage(t('A postal code can only contain digits.'));
      return;
    }
    if (postalCode.length !== 6) {
      setErrorMessage(t('A postal code is 6 digits long. Please try again.'));
      return;
    }
    if (!flatNo.trim()) {
      setErrorMessage(t('Please enter your unit number.'));
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage(t('Please accept the Terms & Conditions.'));
      return;
    }

    setErrorMessage('');

    try {
      await setDoc(doc(db, "users", storedPhoneNumber), {
        phoneNumber: storedPhoneNumber,
        language,
        postalCode,
        flatNo,
        requests: {},
        history: {},
        remarks: {},
        favorites: [],
      });
      console.log('User data uploaded successfully');
      localStorage.setItem("Tutorial", "true");
      history.push('/tabs/home');
    } catch (error) {
      setErrorMessage(t('Failed to register. Please try again.'));
      console.error('Error uploading user data:', error);
    }
  };

  const closeTC = () => {
    setShowModal(false);
  }

  // Effect to scroll to top when an error message is set
  useEffect(() => {
    if (errorMessage) {
      contentRef.current?.scrollToTop(300);  // Scroll to top with a duration of 300ms
    }
  }, [errorMessage]);

  return (
    <IonPage>
      <IonHeader style={{ height: '10vh' }}>
        <IonToolbar color='primary' style={{ height: '10vh', lineHeight: '10vh' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Setup</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} className="ion-padding">
        <h2>Please choose a language</h2>

        {errorMessage && (
          <IonText color="primary">
            <b><p>{errorMessage}</p></b>
          </IonText>
        )}

        <IonGrid>
          <IonRow>
            <IonCol>
              <IonButton
                style={{ fontSize: 'var(--global-font-size)', height: 'auto' }}  // Use CSS variable for font size
                expand="block"
                color={language === 'English' ? 'primary' : 'light'}
                onClick={() => {
                  setLanguage('English');
                  i18n.changeLanguage("english");
                }}
              >
                English
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton
                style={{ fontSize: 'var(--global-font-size)', height: 'auto' }}
                expand="block"
                color={language === 'Chinese' ? 'primary' : 'light'}
                onClick={() => {
                  setLanguage('Chinese');
                  i18n.changeLanguage("chinese");
                }}
              >
                华语
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton
                style={{ fontSize: 'var(--global-font-size)', height: 'auto' }}  // Use CSS variable for font size
                expand="block"
                color={language === 'Tamil' ? 'primary' : 'light'}
                onClick={() => {
                  setLanguage('Tamil');
                  i18n.changeLanguage("tamil");
                }}
              >
                தமிழ்
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton
                style={{ fontSize: 'var(--global-font-size)', height: 'auto' }}  // Use CSS variable for font size
                expand="block"
                color={language === 'Malay' ? 'primary' : 'light'}
                onClick={() => {
                  setLanguage('Malay');
                  i18n.changeLanguage("malay");
                }}
              >
                Bahasa Melayu
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonInput
          mode="md"
          fill="outline"
          label={t("Postal Code")}
          labelPlacement="floating"
          value={postalCode}
          onIonInput={(e) => setPostalCode(e.detail.value!)}
          placeholder={t("Enter your postal code")}
          style={{ fontSize: 'var(--global-font-size)', marginBottom: '15px' }}
        />

        <IonInput
          mode="md"
          fill="outline"
          label={t("Unit Number")}
          labelPlacement="floating"
          value={flatNo}
          onIonInput={(e) => setFlatNo(e.detail.value!)}
          placeholder={t("Enter your unit number")}
          style={{ fontSize: 'var(--global-font-size)', marginBottom: '15px' }}
        />

        <IonItem lines="none">
          <IonCheckbox
            slot="start"
            checked={acceptedTerms}
            onIonChange={e => setAcceptedTerms(e.detail.checked!)}
          />
          <IonLabel style={{ display: 'inline', marginLeft: '0', fontSize: 'var(--global-font-size)' }}>
            {t("I accept the")}{' '}
            <a
              href="#"
              style={{ fontSize: 'var(--global-font-size)' }}
              onClick={(e) => {
                e.preventDefault();
                setShowModal(true);
              }}
            >
              {t("Terms & Conditions")}
            </a>
          </IonLabel>
        </IonItem>

        <IonButton expand="block" onClick={handleContinue}>
          {t("Continue")}
        </IonButton>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Terms & Conditions</IonTitle>
              <IonButtons slot="end" onClick={closeTC}>
                <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <iframe
              src="/T&C.html"
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
