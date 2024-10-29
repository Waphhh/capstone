import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonIcon,
  IonLoading,
  IonModal,
  IonFab,
  IonTextarea,
  IonButtons
} from '@ionic/react';
import { buildOutline, closeOutline, logOut } from 'ionicons/icons'; // Import the log-out icon
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useHistory } from 'react-router-dom';
import { db } from './firebaseConfig';
import TabsToolbar from './TabsToolbar';
import { useTranslation } from 'react-i18next';
import { fetchUserLanguage } from './GetLanguage';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [flatNo, setFlatNo] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  const [loading, setLoading] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: '' });
  const [uploading, setupLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false); // New state for feedback loading

  const storedPhoneNumber = localStorage.getItem('phoneNumber');

  useEffect(() => {
    
    const fetchData = async () => {
      if (storedPhoneNumber) {
        try {
          const docRef = doc(db, 'users', storedPhoneNumber);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setPhoneNumber(data.phoneNumber || '');
            setPostalCode(data.postalCode || '');
            setFlatNo(data.flatNo || ''); // Changed from unitNo to flatNo
            setLanguage(data.language || 'English');
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [storedPhoneNumber]);

  function containsOnlyDigits(str: string) {
    return /^\d+$/.test(str);
  }

  const handleSave = async () => {
    if (storedPhoneNumber) {
      const flatparts = flatNo.trim().split("-");
      if (flatparts.length !== 2) {
        setShowToast({ isOpen: true, message: t('Please enter your unit number in the format XX-XX.') });
        return;
      } else if (phoneNumber.length !== 8) {
        setShowToast({ isOpen: true, message: t('A phone number is 8 digits long. Please try again.') });
      } else if (!(containsOnlyDigits(phoneNumber))) {
        setShowToast({ isOpen: true, message: t('A phone number can only contain numbers. Please try again.') });
      } else if (postalCode.length !== 6) {
        setShowToast({ isOpen: true, message: t('A postal code is 6 digits long. Please try again.') });
      } else if (!(containsOnlyDigits(postalCode))) {
        setShowToast({ isOpen: true, message: t('A postal code can only contain numbers. Please try again.') });
      } else if (flatNo.length === 0) {
        setShowToast({ isOpen: true, message: t('Unit number cannot be empty. Please try again.') });
      } else {
        try {
          setupLoading(true);
          const docRef = doc(db, 'users', storedPhoneNumber);
          await updateDoc(docRef, {
            phoneNumber,
            postalCode,
            flatNo,
            language,
          });
          setShowToast({ isOpen: true, message: t('Settings updated successfully!') });
          history.push('/tabs/home');
        } catch (error) {
          console.error('Error updating settings:', error);
          setShowToast({ isOpen: true, message: t('Error updating settings. Please try again.') });
        } finally {
          setupLoading(false);
        }
      }
    }
  };

  const handleLogout = () => {
    // Clear phone number and details
    localStorage.clear();
    history.push('/');
  };

  const generateShortId = (length = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  
    return result;
  };  

  const handleSaveFeedback = async () => {
    setSubmittingFeedback(true);
    let feedbackuuid = generateShortId();
    let userDocRef = doc(db, 'feedback', feedbackuuid);
    let userDoc;
  
    try {
      // Regenerate `feedbackuuid` until a unique ID is found
      do {
        userDocRef = doc(db, 'feedback', feedbackuuid);
        userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          feedbackuuid = generateShortId(); // Generate a new ID if it already exists
        }
      } while (userDoc.exists());
  
      // Proceed to use the unique feedbackuuid and save feedback text
      await setDoc(userDocRef, { "Feedback": feedbackText });  // Storing feedback text with feedbackuuid as the document name
      
      setShowToast({ isOpen: true, message: t("Feedback submitted. Thank you!") });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setShowToast({ isOpen: true, message: t('An error occurred. Please try again.') });
    } finally {
      setShowModal(false);
      setFeedbackText('');
      setSubmittingFeedback(false);
    }
  
  };    

  useEffect(() => {
    const loadUserLanguage = async () => {
      const success = await fetchUserLanguage(db); // Call the function and await its result
      setLoading(!success); // Set loading to true if fetching failed, false if successful
    };

    loadUserLanguage();
  }, [db]);

  if (loading) return <p>{t("Loading...")}</p>;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{t("Settings")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonInput
                mode="md"
                fill="outline"  // Set fill as outline
                label={t("Phone Number")}  // Add label directly to IonInput
                labelPlacement="floating"  // Use floating label
                value={phoneNumber}
                onIonInput={(e) => setPhoneNumber(e.detail.value!)}
                style={{ fontSize: 'var(--global-font-size)', marginBottom: '15px' }}  // Apply global font size
              />

              <IonInput
                mode="md"
                fill="outline"  // Set fill as outline
                label={t("Postal Code")}  // Add label directly to IonInput
                labelPlacement="floating"  // Use floating label
                value={postalCode}
                onIonInput={(e) => setPostalCode(e.detail.value!)}
                style={{ fontSize: 'var(--global-font-size)', marginBottom: '15px' }}  // Apply global font size
              />

              <IonInput
                mode="md"
                fill="outline"  // Set fill as outline
                label={t("Unit Number")}  // Add label directly to IonInput
                labelPlacement="floating"  // Use floating label
                value={flatNo}
                onIonInput={(e) => setFlatNo(e.detail.value!)}
                style={{ fontSize: 'var(--global-font-size)', marginBottom: '15px' }}  // Apply global font size
              />

              <IonItem style={{ paddingRight: '16px' }}>
                <IonLabel style={{ fontSize: 'var(--global-font-size)' }}>{t("Language")}</IonLabel>
                <IonSelect
                  value={language}
                  placeholder="Select Language"
                  onIonChange={(e) => setLanguage(e.detail.value!)}
                  style={{ fontSize: 'var(--global-font-size)' }}  // Apply global font size to select
                >
                  <IonSelectOption value="English">English</IonSelectOption>
                  <IonSelectOption value="Chinese">华语</IonSelectOption>
                  <IonSelectOption value="Tamil">தமிழ்</IonSelectOption>
                  <IonSelectOption value="Malay">Bahasa Melayu</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonButton 
                expand="full" 
                shape='round' 
                color='tertiary' 
                onClick={handleSave} 
                style={{ marginTop: '10px' }}  // Apply global font size to button
              >
                {t("Save")}
              </IonButton>

              <IonButton 
                expand="full" 
                onClick={handleLogout} 
                color="primary"
                style={{ marginTop: '10px' }}  // Apply global font size to button
                shape='round'
              >
                <IonIcon slot="start" icon={logOut} />
                {t("Logout")}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonButton
            color="tertiary"
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center' }}
            shape="round"
          >
            <IonIcon icon={buildOutline} style={{ marginRight: '8px' }} />
            <span>Feedback</span>
          </IonButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>{t("Submit Feedback")}</IonTitle>
              <IonButtons slot="end" onClick={() => setShowModal(false)}>
                <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <IonTextarea
              mode="md"
              fill="outline"
              label={t("Feedback")}
              labelPlacement="floating"
              placeholder={t("Type your feedback here...")}
              value={feedbackText}
              onIonInput={(e) => setFeedbackText(e.detail.value!)}
              rows={6}
            />
            
            <IonButton expand="block" color="tertiary" shape='round' onClick={handleSaveFeedback} style={{ marginTop: '20px' }}>
              {t("Submit Feedback")}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast.isOpen}
          onDidDismiss={() => setShowToast({ ...showToast, isOpen: false })}
          message={showToast.message}
          duration={2000}
          position="bottom"
        />

        <IonLoading isOpen={uploading} message={t("Updating settings...")} />
        <IonLoading isOpen={submittingFeedback} message={t("Submitting feedback...")} />

      </IonContent>

      <TabsToolbar />

    </IonPage>
  );
};

export default Settings;
