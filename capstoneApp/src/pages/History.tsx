import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonBackButton,
  IonFooter,
  IonButton,
  IonIcon
} from '@ionic/react';
import { db } from './firebaseConfig'; // Ensure Firebase is initialized
import { homeOutline, settingsOutline, peopleOutline, bookOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';

const Library: React.FC = () => {
  const [userHistory, setuserHistory] = useState<any[]>([]);
  const storedPhoneNumber = localStorage.getItem('phoneNumber');

  // Fetch user language from Firestore
  // Function to fetch requests from Firestore for the current user
  const fetchOngoingRequests = async () => {
    try {
      if (storedPhoneNumber) {
        const docRef = doc(db, 'users', storedPhoneNumber);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const history = userData.history || {};
          const requestsArray = Object.keys(history).map((key) => ({
            historyItem: key,
            index: history[key],
          }));

          setuserHistory(requestsArray);
        } else {
          console.log("No such document!");
        }
      } else {
        console.log("Phone number not found in localStorage");
      }
    } catch (error) {
      console.error('Error fetching ongoing requests:', error);
    }
  };

  useEffect(() => {
    fetchOngoingRequests();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>History</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            {userHistory.length > 0 ? (
              userHistory.map((item, index) => (
                <IonCol size="12" size-md="6" key={index}>
                  <IonCard>
                    <IonCardContent>
                      <p>Date: {item.historyItem}</p>
                      <p>Comment: {item.index}</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))
            ) : (
              <p>No history</p>
            )}
          </IonRow>
        </IonGrid>
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

export default Library;
