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
  IonIcon
} from '@ionic/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useHistory } from 'react-router-dom';
import { db } from './firebaseConfig';
import TabsToolbar from './TabsToolbar';
import { logOut } from 'ionicons/icons'; // Import the log-out icon

const Settings: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [flatNo, setFlatNo] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  const [loading, setLoading] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: '' });
  const history = useHistory();

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
      const regex = /^\d+$/;
      const flatparts = flatNo.trim().split("-");
      if (flatparts.length !== 2) {
        setShowToast({ isOpen: true, message: 'Please enter your unit number in the format XX-XX.'});
        return;
      } else if (flatNo.trim().length !== 5) {
        setShowToast({ isOpen: true, message: 'Please enter your unit number in the format XX-XX.'});
        return;
      } else if (!(regex.test(flatparts[0]))) {
        setShowToast({ isOpen: true, message: 'Please enter your unit number in the format XX-XX.'});
        return;
      } else if (!(regex.test(flatparts[1]))) {
        setShowToast({ isOpen: true, message: 'Please enter your unit number in the format XX-XX.'});
        return;
      }  else if (phoneNumber.length !== 8) {
        setShowToast({ isOpen: true, message: 'A phone number is 8 digits long. Please try again.' });
      } else if (!(containsOnlyDigits(phoneNumber))) {
        setShowToast({ isOpen: true, message: 'A phone number can only contain numbers. Please try again.' });
      } else if (postalCode.length !== 6) {
        setShowToast({ isOpen: true, message: 'A postal code is 6 digits long. Please try again.' });
      } else if (!(containsOnlyDigits(postalCode))) {
        setShowToast({ isOpen: true, message: 'A postal code can only contain numbers. Please try again.' });
      } else if (flatNo.length === 0) {
        setShowToast({ isOpen: true, message: 'Unit number cannot be empty. Please try again.' });
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

  const handleLogout = () => {
    // Clear phone number and details
    localStorage.removeItem('phoneNumber');
    // Add any other data cleanup as needed
    history.push('/'); // Navigate to the home page
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
                <IonLabel position="floating" style={{ marginBottom: '15px' }}>Phone Number</IonLabel>
                <IonInput
                  value={phoneNumber}
                  onIonInput={(e) => setPhoneNumber(e.detail.value!)}
                />
              </IonItem>
              <IonItem style={{ paddingRight: '16px' }}>
                <IonLabel position="floating" style={{ marginBottom: '15px' }}>Postal Code</IonLabel>
                <IonInput
                  value={postalCode}
                  onIonInput={(e) => setPostalCode(e.detail.value!)}
                />
              </IonItem>
              <IonItem style={{ paddingRight: '16px' }}>
                <IonLabel position="floating" style={{ marginBottom: '15px' }}>Unit number</IonLabel>
                <IonInput
                  value={flatNo}
                  onIonInput={(e) => setFlatNo(e.detail.value!)}
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
              <IonButton expand="full" onClick={handleSave} style={{ marginTop: '10px' }} shape='round'>
                Save
              </IonButton>
              <IonButton 
                expand="full" 
                onClick={handleLogout} 
                color="danger" 
                style={{ marginTop: '10px' }} 
                shape='round'
              >
                <IonIcon slot="start" icon={logOut} />
                Logout
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={showToast.isOpen}
          onDidDismiss={() => setShowToast({ ...showToast, isOpen: false })}
          message={showToast.message}
          duration={2000}
          position="bottom"
        />
      </IonContent>

      <TabsToolbar />

    </IonPage>
  );
};

export default Settings;
