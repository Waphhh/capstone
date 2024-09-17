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
  IonButtons,
  IonBackButton
} from '@ionic/react';
import { db } from './firebaseConfig'; // Ensure Firebase is initialized
import { doc, getDoc } from 'firebase/firestore';
import * as Papa from 'papaparse';

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
      console.log(csvText)
      const parsedData = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });
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

  useEffect(() => {
    fetchUserLanguage(); // Fetch the user's language on component mount
  }, []);

  useEffect(() => {
    const loadAndFilterTutorials = async () => {
      if (userLanguage) {
        const tutorials = await fetchCSVData(); // Fetch CSV data
        const filtered = filterTutorialsByLanguage(tutorials, userLanguage);
        setFilteredTutorials(filtered);
      }
    };

    loadAndFilterTutorials();
  }, [userLanguage]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
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
    </IonPage>
  );
};

export default Library;
