import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonLabel,
} from '@ionic/react';
import { db } from './firebaseConfig'; // Ensure Firebase is initialized
import { doc, getDoc } from 'firebase/firestore';
import { Route } from 'react-router';
import { homeOutline, settingsOutline, peopleOutline, bookOutline } from 'ionicons/icons';
import * as Papa from 'papaparse';
import './footer.css'

// CSV file path (adjust if needed)
const csvFilePath = './resources.csv';

const Library: React.FC = () => {

  const [userLanguage, setUserLanguage] = useState<string | null>(null);
  const [filteredTutorials, setFilteredTutorials] = useState<any[]>([]);

  const storedPhoneNumber = localStorage.getItem('phoneNumber');

  // Fetch user language from Firestore
  const fetchUserLanguage = async () => {
    try {
      if (storedPhoneNumber) {
        const docRef = doc(db, 'users', storedPhoneNumber);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserLanguage(userData.language || null);
        } else {
          console.log('No such document!');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch and parse the CSV file
  const fetchCSVData = async () => {
    try {
      const response = await fetch(csvFilePath);
      const csvText = await response.text();
      const parsedData = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });
      console.log(parsedData.data);
      return parsedData.data;
    } catch (error) {
      console.error('Error fetching CSV:', error);
      return [];
    }
  };

  // Filter tutorials by user's preferred language
  const filterTutorialsByLanguage = (tutorials: any[], language: string | null) => {
    if (!language) return [];

    return tutorials.filter((tutorial) => {
      return tutorial.Language.toLowerCase().includes(language.toLowerCase());
    });
  };

  const loadAndFilterTutorials = async () => {
    if (userLanguage) {
      const tutorials = await fetchCSVData(); // Fetch CSV data
      const filtered = filterTutorialsByLanguage(tutorials, userLanguage);
      setFilteredTutorials(filtered);
    }
  };

  useEffect(() => {
    console.log("use effect1 triggered");
    loadAndFilterTutorials();
  }, [userLanguage]); 

  useEffect(() => {
    console.log("use effect2 triggered");
    fetchUserLanguage();
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>Library</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            {filteredTutorials.length > 0 ? (
              filteredTutorials.map((tutorial, index) => (
                <IonCol size="12" size-md="6" key={index}>
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>{tutorial.Title}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p>Content: {tutorial.Content}</p>
                      <p>Type: {tutorial.Type}</p>
                      <p>Language: {tutorial.Language}</p>
                      <a href={tutorial.Link} target="_blank" rel="noopener noreferrer">
                        Watch Video
                      </a>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))
            ) : (
              <p>No tutorials available for your language</p>
            )}
          </IonRow>
        </IonGrid>
      </IonContent>

      <IonToolbar>
        <IonTabs>
          <IonRouterOutlet>
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
