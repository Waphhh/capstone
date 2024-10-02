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
  IonSearchbar,
  IonButton,
} from '@ionic/react';
import { db } from './firebaseConfig';
import { updateDoc, arrayUnion, arrayRemove, doc, getDoc } from 'firebase/firestore';
import { Route, useLocation } from 'react-router';
import { homeOutline, settingsOutline, peopleOutline, bookOutline, heart, heartOutline } from 'ionicons/icons';
import * as Papa from 'papaparse';

import './footer.css'

const csvFilePath = './resources.csv';

const Library: React.FC = () => {
  const [userLanguage, setUserLanguage] = useState<string | null>(null);
  const [filteredTutorials, setFilteredTutorials] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const location = useLocation();

  // Fetch user language and favorites from Firestore
  const fetchUserData = async () => {
    try {
      if (storedPhoneNumber) {
        const docRef = doc(db, 'users', storedPhoneNumber);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserLanguage(userData.language || null);
          setFavorites(userData.favorites || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch and parse CSV data
  const fetchCSVData = async () => {
    const response = await fetch(csvFilePath);
    const csvText = await response.text();
    const parsedData = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    return parsedData.data;
  };

  // Filter tutorials by language
  const filterTutorialsByLanguage = (tutorials: any[], language: string | null) => {
    return language ? tutorials.filter(t => t.Language.toLowerCase().includes(language.toLowerCase())) : [];
  };

  // Filter tutorials by search
  const filterTutorialsBySearch = (tutorials: any[], query: string) => {
    return tutorials.filter((tutorial) =>
      tutorial.Title.toLowerCase().includes(query.toLowerCase()) ||
      tutorial.Content.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Filter out already favorited tutorials
  const filterOutFavorited = (tutorials: any[], favorites: any[]) => {
    return tutorials.filter(tutorial => !favorites.some(fav => fav.Title === tutorial.Title));
  };

  const loadAndFilterTutorials = async () => {
    const tutorials = await fetchCSVData();
    let filtered = filterTutorialsByLanguage(tutorials, userLanguage);

    if (searchQuery) {
      filtered = filterTutorialsBySearch(filtered, searchQuery);
    }

    // Remove already favorited tutorials from the list
    filtered = filterOutFavorited(filtered, favorites);

    setFilteredTutorials(filtered);
  };

  // Add a tutorial to the user's favorites
  const addToFavorites = async (tutorial: any) => {
    if (storedPhoneNumber) {
      const userDocRef = doc(db, 'users', storedPhoneNumber);
      await updateDoc(userDocRef, {
        favorites: arrayUnion(tutorial),
      });
      setFavorites([...favorites, tutorial]); // Update local favorites state
    }
  };

  // Remove a tutorial from the user's favorites (unfavoriting)
  const removeFromFavorites = async (tutorial: any) => {
    if (storedPhoneNumber) {
      const userDocRef = doc(db, 'users', storedPhoneNumber);
      await updateDoc(userDocRef, {
        favorites: arrayRemove(tutorial),
      });
      setFavorites(favorites.filter((fav) => fav.Title !== tutorial.Title)); // Update local favorites state
    }
  };

  useEffect(() => {
    console.log("location changed");
    fetchUserData();
  }, [location])

  useEffect(() => {
    console.log("refreshed");
    loadAndFilterTutorials();
  }, [userLanguage, searchQuery, favorites]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>Library</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            placeholder="Look for a tutorial"
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value!)}
          />
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            {/* Display favorited tutorials */}
            {favorites.length > 0 && (
              <IonCol size="12">
                {favorites.map((tutorial, index) => (
                  <IonCard key={index} style={{ backgroundColor: '#f0f0f0', borderRadius: '15px', overflow: 'hidden' }}>
                    <IonCardHeader>
                      <IonCardTitle>{tutorial.Title}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p>{tutorial.Content}</p>
                      <center>
                        <iframe
                            title="YouTube Video Player"
                            width="100%"
                            height="100%"
                            src={tutorial.Link.replace('watch?v=', 'embed/')} // Convert link to embed link
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                      </center>
                      <IonButton href={tutorial.Link} target="_blank" style={{ margin: '0px', borderRadius: '30px', overflow: 'hidden' }}>Go learn</IonButton>
                      <IonButton onClick={() => removeFromFavorites(tutorial)} style={{ borderRadius: '30px', overflow: 'hidden' }}>
                        <IonIcon icon={heart} /> Unfavorite
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonCol>
            )}

            {/* Display filtered tutorials, excluding favorited ones */}
            {filteredTutorials.length > 0 ? (
              filteredTutorials.map((tutorial, index) => (
                <IonCol size="12" size-md="6" key={index}>
                  <IonCard style={{ backgroundColor: '#f0f0f0', borderRadius: '15px', overflow: 'hidden' }}>
                    <IonCardHeader>
                      <IonCardTitle>{tutorial.Title}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p>{tutorial.Content}</p>
                      <center>
                        <iframe
                            title="YouTube Video Player"
                            width="100%"
                            height="100%"
                            src={tutorial.Link.replace('watch?v=', 'embed/')} // Convert link to embed link
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                      </center>
                      <IonButton href={tutorial.Link} target="_blank" style={{ margin: '0px', borderRadius: '30px', overflow: 'hidden' }}>Go learn</IonButton>
                      <IonButton onClick={() => addToFavorites(tutorial)} style={{ borderRadius: '30px', overflow: 'hidden' }}>
                        <IonIcon icon={favorites.some(fav => fav.Title === tutorial.Title) ? heart : heartOutline} />
                        {favorites.some(fav => fav.Title === tutorial.Title) ? 'Favorited' : 'Favorite'}
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))
            ) : (
              <p>No tutorials available for your language or search term</p>
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
