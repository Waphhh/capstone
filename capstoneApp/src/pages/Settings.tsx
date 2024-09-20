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
  IonIcon,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton
} from '@ionic/react';
import { homeOutline, settingsOutline, peopleOutline, bookOutline } from 'ionicons/icons';
import { Route } from 'react-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useHistory } from 'react-router-dom';
import { auth, db } from './firebaseConfig'; // Adjust the import path as needed
import './footer.css'

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

  function containsOnlyDigits(str) {
    return /^\d+$/.test(str);
  }

  const handleSave = async () => {
    if (storedPhoneNumber) {
      if (phoneNumber.length != 8) {
        setShowToast({ isOpen: true, message: 'A phone number is only 8 digits long. Please try again.' });
      } else if (!(containsOnlyDigits(phoneNumber))) {
        setShowToast({ isOpen: true, message: 'A phone number can only contain numbers. Please try again.' });
      } else if (postalCode.length != 6) {
        setShowToast({ isOpen: true, message: 'A postal code is only 6 digits long. Please try again.' });
      } else if (!(containsOnlyDigits(postalCode))) {
        setShowToast({ isOpen: true, message: 'A postal code can only contain numbers. Please try again.' });
      } else if (flatNo.length == 0) {
        setShowToast({ isOpen: true, message: 'Flat/Unit number cannot be empty. Please try again.' });
      } else {
        try {
          const docRef = doc(db, 'users', storedPhoneNumber);
          await updateDoc(docRef, {
            phoneNumber,
            postalCode,
            flatNo,
            language,
          });
          setShowToast({ isOpen: true, message: 'Settings updated successfully!' });
          history.push('/tabs/home');
        } catch (error) {
          console.error('Error updating settings:', error);
          setShowToast({ isOpen: true, message: 'Error updating settings. Please try again.' });
        }
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
              <IonItem style={{ paddingRight: '16px' }}>
                <IonLabel position="floating" style={{marginBottom: '15px' }}>Phone Number</IonLabel>
                <IonInput
                  value={phoneNumber}
                  onIonInput={(e) => setPhoneNumber(e.detail.value!)}
                />
              </IonItem>
              <IonItem style={{ paddingRight: '16px' }}> 
                <IonLabel position="floating" style={{marginBottom: '15px'}}>Postal Code</IonLabel>
                <IonInput
                  value={postalCode}
                  onIonInput={(e) => setPostalCode(e.detail.value!)}
                />
              </IonItem>
              <IonItem style={{ paddingRight: '16px' }}>
                <IonLabel position="floating" style={{marginBottom: '15px'}}>Flat/Unit number</IonLabel> {/* Changed from Unit Number to Flat Number */}
                <IonInput
                  value={flatNo} // Changed from unitNo to flatNo
                  onIonInput={(e) => setFlatNo(e.detail.value!)} // Changed from unitNo to flatNo
                />
              </IonItem>
              <IonItem style={{ paddingRight: '16px' }}>
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
              <IonButton expand="full" onClick={handleSave} style={{ marginTop: '10px'}}>
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

      <IonToolbar>
        <IonTabs>
          <IonRouterOutlet>
            {/* Define your routes here */}
            <Route path="/tabs/home" exact={true} />
            <Route path="/tabs/history" exact={true} />
            <Route path="/tabs/library" exact={true} />
            <Route path="/tabs/settings" exact={true} />
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/tabs/home">
              <IonIcon icon={homeOutline} style={{ fontSize: '28px' }} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>

            <IonTabButton tab="history" href="/tabs/history">
              <IonIcon icon={peopleOutline} style={{ fontSize: '28px' }} />
              <IonLabel>History</IonLabel>
            </IonTabButton>

            <IonTabButton tab="library" href="/tabs/library">
              <IonIcon icon={bookOutline} style={{ fontSize: '28px' }} />
              <IonLabel>Library</IonLabel>
            </IonTabButton>

            <IonTabButton tab="settings" href="/tabs/settings">
              <IonIcon icon={settingsOutline} style={{ fontSize: '28px' }} />
              <IonLabel>Settings</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonToolbar>

    </IonPage>
  );
};

export default Settings;
