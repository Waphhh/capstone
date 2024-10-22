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
import { db, firebaseConfig } from './firebaseConfig';
import { updateDoc, arrayUnion, arrayRemove, doc, getDoc } from 'firebase/firestore';
import { useLocation } from 'react-router';
import { closeOutline, heart, heartOutline } from 'ionicons/icons';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import TabsToolbar from './TabsToolbar';
import { fetchUserLanguage } from './GetLanguage';
import { useTranslation } from 'react-i18next';
import { gapi } from 'gapi-script';

// The google sheet live update only reaches the 200th row.
// https://docs.google.com/spreadsheets/d/1QoWoZL4Hv_jjO19VhLIq4MjJos3Yxu6NH6i_hxYjnpw/edit?usp=sharing

const Library: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation

  const [loading, setLoading] = useState<boolean>(true);
  const [userLanguage, setUserLanguage] = useState<string | null>(null);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [filteredTutorials, setFilteredTutorials] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const location = useLocation();

  const categories = [
    { id: 1, label: 'Social Media', src: 'SocialMedia.png'},
    { id: 2, label: 'Communication', src: 'Communication.png'},
    { id: 3, label: 'E-payment', src: 'e-payment.png'},
    { id: 4, label: 'Transportation', src: 'Transportation.png'},
  ]

  const options = [
    { id: 1, label: 'X', src: 'X.png', cat: 'Social Media'},
    { id: 2, label: 'Instagram', src: 'Instagram.png', cat: 'Social Media'},
    { id: 3, label: 'Facebook', src: 'Facebook.png', cat: 'Social Media'},
    { id: 4, label: 'Tik Tok', src: '.png', cat: 'Social Media'}, // requires written permission to use

    { id: 5, label: 'WhatsApp', src: 'Whatsapp.png', cat: 'Communication'},
    { id: 6, label: 'Telegram', src: 'Telegram.png', cat: 'Communication'},

    { id: 7, label: 'PayLah!', src: 'Paylah.png', cat: 'E-payment'},
    { id: 8, label: 'PayNow', src: 'PayNow.png', cat: 'E-payment'},
    { id: 9, label: 'Apple Pay', src: '.png', cat: 'E-payment'},

    { id: 10, label: 'MyTransport', src: 'MyTransport.png', cat: 'Transportation'},
    { id: 11, label: 'Google Maps', src: '.png', cat: 'Transportation'},
    { id: 12, label: 'Grab', src: 'Grab.png', cat: 'Transportation'},

  ];

  const { apiKey, sheetId, discoveryDocs } = firebaseConfig.googleSheets;

  // const options = firstoptions.map(option => {
  //   const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  //   // console.log(userAgent);
  //   if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
  //     if (option.label === "Settings") {
  //       return {...option, src: 'Settings.webp'};
  //     }
  //   } else {
  //     if (option.label === "Settings") {
  //       return {...option, src: 'Settings.png'};
  //     }
  //   }
  //   return option;
  // })

  // Fetch user language and favorites from Firestore

  function loadGapiClient() {
    return new Promise((resolve) => {
      gapi.load('client', resolve);
    });
  }
  
  async function initializeGapi() {
    await loadGapiClient();
    await gapi.client.init({
      apiKey: apiKey, // Use your Firebase generated API key
      discoveryDocs: discoveryDocs,
    });
  }

  async function fetchSheetData(sheetId, range) {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
      });
      const rows = response.result.values; // This will return the raw data from the sheet
  
      if (!rows || rows.length === 0) {
        console.log('No data found in the sheet.');
        return [];
      }
  
      // Define the object structure (keys for each field)
      const headers = ["", "Title", "Link", "Content", "Type", "Language", "Comments", "Author", "Approved?"];
  
      // Map each row to an object
      const data = rows.map(row => {
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index] || ""; // If no data for a field, set as empty string
        });
        return rowData;
      });
  
      console.log(data); // Handle your mapped data here
      return data;
    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error);
    }
  }   

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
    return tutorials.filter(tutorial => !favorites.some(fav => fav === tutorial.Title));
  };

  const filterTutorialsByOption = (tutorials: any[], option: string) => {
    return tutorials.filter((tutorial) => tutorial.Content === option);
  };

  const filterFavoritesByOption = (favorites: any[], option: string) => {
    return favorites.filter((favorite) => favorite.Content === option);
  };

  const loadAndFilterTutorials = async () => {
    await initializeGapi();
    const tutorials = await fetchSheetData(sheetId, "Sheet1!A2:H200");

    console.log(tutorials);

    let filtered = filterTutorialsByLanguage(tutorials, userLanguage);
  
    if (searchQuery) {
      filtered = filterTutorialsBySearch(filtered, searchQuery);
    }
  
    if (selectedOption) {
      filtered = filterTutorialsByOption(filtered, selectedOption);
    }

    console.log(filtered);
  
    // Remove already favorited tutorials from the list
    filtered = filterOutFavorited(filtered, favorites);

    console.log(filtered);
  
    setFilteredTutorials(filtered);
    setTutorials(tutorials);
  };  

  // Add a tutorial to the user's favorites
  const addToFavorites = async (tutorial: any) => {
    if (storedPhoneNumber) {
      const userDocRef = doc(db, 'users', storedPhoneNumber);
      await updateDoc(userDocRef, {
        favorites: arrayUnion(tutorial.Title),
      });
      setFavorites([...favorites, tutorial.Title]); // Update local favorites state
    }
  };

  // Remove a tutorial from the user's favorites (unfavoriting)
  const removeFromFavorites = async (tutorial: any) => {
    if (storedPhoneNumber) {
      const userDocRef = doc(db, 'users', storedPhoneNumber);
      await updateDoc(userDocRef, {
        favorites: arrayRemove(tutorial.Title),
      });
      setFavorites(favorites.filter((fav) => fav !== tutorial.Title)); // Update local favorites state
    }
  };

  const handleConfirm = () => {
    setIsCategoriesOpen(true);
  }

  const handleOptionSelect = () => {
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
  }

  const closeCategories = () => {
    setIsCategoriesOpen(false);
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
          {categories.map(option => (
            <div
              key={option.id}
              onClick={() => {
                setSelectedCategory(option.label);
                handleConfirm();
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between', // Ensures icon stays at the top and text at the bottom
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
                style={{ 
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain', 
                  margin: 'auto', 
                  padding: option.label === 'Social Media'? '0px' : '5px',
                  backgroundColor: 'white',
                  borderRadius: '8px'
                }}
              />
              <IonLabel style={{ fontSize: '16px', marginTop: '10px' }}>
                {option.label}
              </IonLabel>
            </div>
          ))}
        </div>

        <p>{t("We are not affiliated with any of the apps shown.")}</p>
      </IonContent>

      <IonModal isOpen={isCategoriesOpen} onDidDismiss={closeCategories}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>{selectedCategory}</IonTitle>
            <IonButtons slot="end" onClick={closeCategories}>
              <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
            </IonButtons>
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
              {options
                .filter(option => option.cat === selectedCategory)
                .map(option => (
                <div
                  key={option.id}
                  onClick={() => {
                    setSelectedOption(option.label);
                    handleOptionSelect();
                  }}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between', // Ensures icon stays at the top and text at the bottom
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
                    style={{ 
                      width: '80px',
                      height: '80px',
                      objectFit: 'contain', 
                      margin: 'auto', 
                      padding: '20px',
                      backgroundColor: 'white',
                      borderRadius: '8px'
                    }}
                  />
                  <IonLabel style={{ fontSize: '16px', marginTop: '10px' }}>
                    {option.label}
                  </IonLabel>
                </div>
              ))}
            </div>

            <p>{t("We are not affiliated with any of the apps shown.")}</p>
          </IonContent>
      </IonModal>

      <IonModal isOpen={isModalOpen} onDidDismiss={closeModal}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>{selectedOption} {t("Library")}</IonTitle>
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
                  {filterFavoritesByOption(tutorials, selectedOption).map((tutorial, index) => (
                    favorites.includes(tutorial.Title) && (  // Check if the title is in the favorites array
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
                    )
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
                <p>{t("No tutorials available for your language or search term")}</p>
              )}
            </IonRow>
          </IonGrid>

          <p style={{ textAlign: 'center' }}>{t("We are not affiliated with any of the apps shown.")}</p>

        </IonContent>
      </IonModal>

      <TabsToolbar />

    </IonPage>
  );
};

export default Library;
