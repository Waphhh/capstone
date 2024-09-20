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
  IonIcon,
  useIonRouter,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonLabel
} from '@ionic/react';
import { db } from './firebaseConfig'; // Ensure Firebase is initialized
import { Route } from 'react-router';
import { homeOutline, settingsOutline, peopleOutline, bookOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import './footer.css'

const Library: React.FC = () => {
  const router = useIonRouter();

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

export default Library;
