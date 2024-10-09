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
  IonSearchbar,
  IonButton,
  IonLabel,
  IonModal,
  IonButtons,
} from '@ionic/react';
import { db } from './firebaseConfig';
import { updateDoc, arrayUnion, arrayRemove, doc, getDoc } from 'firebase/firestore';
import { useLocation } from 'react-router';
import { closeOutline, heart, heartOutline } from 'ionicons/icons';
import * as Papa from 'papaparse';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import TabsToolbar from './TabsToolbar';
import i18n from './i18n';
import { useTranslation } from 'react-i18next';

const csvFilePath = './resources.csv';

const Library: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation

  const [loading, setLoading] = useState<boolean>(true);
  const [userLanguage, setUserLanguage] = useState<string | null>(null);
  const [filteredTutorials, setFilteredTutorials] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  const firstoptions = [
    { id: 1, label: 'Whatsapp', src: 'Whatsapp.png'},
    { id: 2, label: 'Facebook', src: 'Facebook.png'},
    { id: 3, label: 'Youtube', src: 'Youtube.png'},
    { id: 4, label: 'E-payment', src: 'e-payment.png'},
    { id: 5, label: 'Settings', src: ''},
    { id: 6, label: 'Grab', src: 'Grab.png'},

    // Add more options as needed
  ];

  const options = firstoptions.map(option => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    // console.log(userAgent);
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      if (option.label === "Settings") {
        return {...option, src: 'Settings.webp'};
      }
    } else {
      if (option.label === "Settings") {
        return {...option, src: 'Settings.png'};
      }
    }
    return option;
  })

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

  const filterTutorialsByOption = (tutorials: any[], option: string) => {
    return tutorials.filter((tutorial) => tutorial.Content === option);
  };

  const filterFavoritesByOption = (favorites: any[], option: string) => {
    return favorites.filter((favorite) => favorite.Content === option);
  };

  const loadAndFilterTutorials = async () => {
    const tutorials = await fetchCSVData();
    let filtered = filterTutorialsByLanguage(tutorials, userLanguage);
  
    if (searchQuery) {
      filtered = filterTutorialsBySearch(filtered, searchQuery);
    }
  
    if (selectedOption) {
      filtered = filterTutorialsByOption(filtered, selectedOption);
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

  const handleConfirm = () => {
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
  }

  useEffect(() => {
    console.log("location changed");
    fetchUserData();
    if (localStorage.getItem('recommendedItem') !== null) {
      setSelectedOption(localStorage.getItem('recommendedItem'));
      setIsModalOpen(true);
      localStorage.removeItem('recommendedItem');
    }
  }, [location])

  useEffect(() => {
    console.log("userLanguage, searchQuery, favorites, selectedOption refresh")
    loadAndFilterTutorials();
  }, [userLanguage, searchQuery, favorites, selectedOption]);
  
  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (storedPhoneNumber) {
        const userDoc = doc(db, 'users', storedPhoneNumber); // Reference to user document
        const userSnapshot = await getDoc(userDoc); // Fetch user document
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const language = userData.language || 'english'; // Default to 'en' if no language found
          i18n.changeLanguage(language.toLowerCase()); // Set the language for i18next
        }
        
        setLoading(false);
      }
    };

    fetchUserLanguage();
  }, [storedPhoneNumber, i18n]);

  if (loading) return <p>{t("Loading...")}</p>;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>{t("Library")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ textAlign: 'center' }}>
        <h3>{t("What do you want to learn?")}</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', // 2 columns
            gap: '16px', // space between items
            justifyItems: 'center', // center items horizontally
            alignItems: 'center', // center items vertically
            padding: '16px'
          }}
        >
          {options.map(option => (
            <div
              key={option.id}
              onClick={() => {
                setSelectedOption(option.label);
                handleConfirm();
              }}
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                backgroundColor: '#d8d8d8',
                padding: '16px',
                width: '100%',
                height: '100%',
                borderRadius: '8px'
              }}
            >
              <img
                src={`iconassets/${option.src}`}
                alt={option.label}
                style={{ width: '80px', height: '80px', borderRadius: '8px' }} // Icon size
              />
              <IonLabel style={{ fontSize: '20px', display: 'block', marginTop: '8px' }}>
                {option.label}
              </IonLabel>
            </div>
          ))}
        </div>
      </IonContent>

      <IonModal isOpen={isModalOpen} onDidDismiss={closeModal}>
        <IonHeader>
          <IonToolbar color="danger">
            <IonTitle>{selectedOption} Library</IonTitle>
            <IonButtons slot="end" onClick={closeModal}>
              <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
            </IonButtons>
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
              {favorites.length > 0 && selectedOption && (
                <IonCol size="12">
                  {filterFavoritesByOption(favorites, selectedOption).map((tutorial, index) => (
                    <IonCard key={index} style={{ backgroundColor: '#f0f0f0', borderRadius: '15px', overflow: 'hidden' }}>
                      <IonCardHeader>
                        <IonCardTitle>{tutorial.Title}</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <p>{tutorial.Content}</p>
                        <LazyLoadComponent>
                          <center>
                            {tutorial.Comments === 'Playlist' ? (
                              <iframe
                                title="YouTube Playlist Player"
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/videoseries?list=${tutorial.Link.split('list=')[1]}`}  // Adjust for playlist ID
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            ) : (
                              <iframe
                                title="YouTube Video Player"
                                width="100%"
                                height="100%"
                                src={tutorial.Link.replace('watch?v=', 'embed/')}  // Adjust for single video
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            )}
                          </center>
                        </LazyLoadComponent>
                        <IonButton href={tutorial.Link} target="_blank" style={{ margin: '0px', borderRadius: '30px', overflow: 'hidden' }}>{t("Watch video")}</IonButton>
                        <IonButton onClick={() => removeFromFavorites(tutorial)} style={{ borderRadius: '30px', overflow: 'hidden' }}>
                          <IonIcon icon={heart} /> Unfavorite
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </IonCol>
              )}

              {filteredTutorials.length > 0 ? (
                filteredTutorials.map((tutorial, index) => (
                  <IonCol size="12" key={index}>
                    <IonCard style={{ backgroundColor: '#f0f0f0', borderRadius: '15px', overflow: 'hidden' }}>
                      <IonCardHeader>
                        <IonCardTitle>{tutorial.Title}</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <p>{tutorial.Content}</p>
                        <LazyLoadComponent>
                          <center>
                            {tutorial.Comments === 'Playlist' ? (
                              <iframe
                                title="YouTube Playlist Player"
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/videoseries?list=${tutorial.Link.split('list=')[1]}`}  // Adjust for playlist ID
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            ) : (
                              <iframe
                                title="YouTube Video Player"
                                width="100%"
                                height="100%"
                                src={tutorial.Link.replace('watch?v=', 'embed/')}  // Adjust for single video
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            )}
                          </center>
                        </LazyLoadComponent>
                        <IonButton href={tutorial.Link} target="_blank" style={{ margin: '0px', borderRadius: '30px', overflow: 'hidden' }}>{t("Watch video")}</IonButton>
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
      </IonModal>

      <TabsToolbar />

    </IonPage>
  );
};

export default Library;
