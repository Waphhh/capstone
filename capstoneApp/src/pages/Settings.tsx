import React, { useState, useEffect } from 'react';
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
  IonButtons,
  IonBackButton,
  IonIcon,
  IonFooter,
} from '@ionic/react';
import { homeOutline, settingsOutline, peopleOutline, bookOutline } from 'ionicons/icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useHistory } from 'react-router-dom';
import { db } from './firebaseConfig'; // Adjust the import path as needed

const Settings: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [flatNo, setFlatNo] = useState<string>(''); // Changed from unitNo to flatNo
  const [language, setLanguage] = useState<string>('English');
  const [loading, setLoading] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: '' });
  const history = useHistory();

  const storedPhoneNumber = localStorage.getItem('phoneNumber'); // Assumes phoneNumber is stored in localStorage

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

  const handleSave = async () => {
    if (storedPhoneNumber) {
      try {
        const docRef = doc(db, 'users', storedPhoneNumber);
        await updateDoc(docRef, {
          phoneNumber,
          postalCode,
          flatNo, // Changed from unitNo to flatNo
          language,
        });
        setShowToast({ isOpen: true, message: 'Settings updated successfully!' });
        history.push('/tabs/home');
      } catch (error) {
        console.error('Error updating settings:', error);
        setShowToast({ isOpen: true, message: 'Error updating settings. Please try again.' });
      }
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonItem>
                <IonLabel position="floating" style={{marginBottom: '15px'}}>Phone Number</IonLabel>
                <IonInput
                  value={phoneNumber}
                  onIonChange={(e) => setPhoneNumber(e.detail.value!)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating" style={{marginBottom: '15px'}}>Postal Code</IonLabel>
                <IonInput
                  value={postalCode}
                  onIonChange={(e) => setPostalCode(e.detail.value!)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating" style={{marginBottom: '15px'}}>Flat/Unit number</IonLabel> {/* Changed from Unit Number to Flat Number */}
                <IonInput
                  value={flatNo} // Changed from unitNo to flatNo
                  onIonChange={(e) => setFlatNo(e.detail.value!)} // Changed from unitNo to flatNo
                />
              </IonItem>
              <IonItem>
                <IonLabel>Language</IonLabel>
                <IonSelect
                  value={language}
                  placeholder="Select Language"
                  onIonChange={(e) => setLanguage(e.detail.value!)}
                >
                  <IonSelectOption value="English">English</IonSelectOption>
                  <IonSelectOption value="Chinese">华语</IonSelectOption>
                  <IonSelectOption value="Tamil">தமிழ்</IonSelectOption>
                  <IonSelectOption value="Malay">Bahasa Melayu</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonButton expand="full" onClick={handleSave}>
                Save
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Toast Notification */}
        <IonToast
          isOpen={showToast.isOpen}
          onDidDismiss={() => setShowToast({ ...showToast, isOpen: false })}
          message={showToast.message}
          duration={2000}
          position="bottom"
        />
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/tabs/home">
                  <IonIcon icon={homeOutline} />
                </IonButton>
              </IonCol>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/tabs/history">
                  <IonIcon icon={peopleOutline} />
                </IonButton>
              </IonCol>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/tabs/library">
                  <IonIcon icon={bookOutline} />
                </IonButton>
              </IonCol>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/tabs/settings">
                  <IonIcon icon={settingsOutline} />
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Settings;
