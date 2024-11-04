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
import Joyride from 'react-joyride';

// The google sheet live update only reaches the 200th row.
// https://docs.google.com/spreadsheets/d/1QoWoZL4Hv_jjO19VhLIq4MjJos3Yxu6NH6i_hxYjnpw/edit?usp=sharing

const Library: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

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
  const [runFirstTutorial, setRunFirstTutorial] = useState(false);
  const [runSecondTutorial, setRunSecondTutorial] = useState(false);
  const [runThirdTutorial, setRunThirdTutorial] = useState(false);
  const [isTutorialCategoriesOpen, setIsTutorialCategoriesOpen] = useState(false);
  const [isTutorialVideosOpen, setIsTutorialVideosOpen] = useState(false);

  const Tutorial = localStorage.getItem("Tutorial");
  const tutorialCompleted = localStorage.getItem("tutorialCompletedLibrary");

  const firstTutorialSteps = [
    {
      target: '.tutorial-library',
      content: 'Click on a category to learn more.',
    },
  ];

  const secondTutorialSteps = [
    {
      target: '.tutorial-category',
      content: 'Click on an app you want to learn more about.',
    },
  ];

  const thirdTutorialSteps = [
    {
      target: '.search-bar', // Assign a class to the search bar for targeting
      content: 'Use this search bar to find specific tutorials.',
    },
    {
      target: '.first-tutorial-card', // Assign a class to the first tutorial card
      content: 'This is a tutorial on how to use ElderGuide. You can play the video or mark it as a favorite.',
    },
    {
      target: '.video-title', // Assign a class to the first tutorial card
      content: 'This is the title of the video.',
    },
    {
      target: '.video-app', // Assign a class to the first tutorial card
      content: 'This is the app that the tutorial is focused on.',
    },
    {
      target: '.video', // Assign a class to the first tutorial card
      content: 'This is the tutorial video.',
    },
    {
      target: '.video-button', // Assign a class to the first tutorial card
      content: 'Click this button to go into to youtube app to watch the video.',
    },
    {
      target: '.video-unfav', // Assign a class to the favorite button
      content: 'Click this button to unfavorite this video.',
    },
    {
      target: '.video-fav', // Assign a class to the favorite button
      content: 'Click this button to favorite this video which will bring it to the top.',
    }
  ];

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
    { id: 4, label: 'Tik Tok', src: 'TikTok.png', cat: 'Social Media'}, // requires written permission to use

    { id: 5, label: 'WhatsApp', src: 'Whatsapp.png', cat: 'Communication'},
    { id: 6, label: 'Telegram', src: 'Telegram.png', cat: 'Communication'},

    { id: 7, label: 'PayLah!', src: 'Paylah.png', cat: 'E-payment'},
    { id: 8, label: 'PayNow', src: 'PayNow.png', cat: 'E-payment'},
    { id: 9, label: 'Apple Pay', src: 'Applepay.svg', cat: 'E-payment'},

    { id: 10, label: 'MyTransport', src: 'MyTransport.png', cat: 'Transportation'},
    { id: 11, label: 'Google Maps', src: 'maps.png', cat: 'Transportation'},
    { id: 12, label: 'Grab', src: 'Grab.png', cat: 'Transportation'},

  ];

  const { apiKey, sheetId, discoveryDocs } = firebaseConfig.googleSheets;

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

  const closeTutorialCategories = () => {
    setIsTutorialCategoriesOpen(false);
  }

  const closeTutorialVideos = () => {
    setIsTutorialVideosOpen(false);
  }

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      setRunFirstTutorial(false);
      setIsTutorialCategoriesOpen(true);
      setRunSecondTutorial(true);
    }
  };

  const handleJoyrideCallback2 = (data) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      setRunSecondTutorial(false);
      setIsTutorialVideosOpen(true);
      setRunThirdTutorial(true);
    }
  };

  const handleJoyrideCallback3 = (data) => {
    const { status, index, action } = data;
    if (status === 'finished' || status === 'skipped') {
      setRunThirdTutorial(false);
      setIsTutorialVideosOpen(false);
      setIsTutorialCategoriesOpen(false);
      localStorage.setItem("tutorialCompletedLibrary", "true");
    }

    if (action === 'start' || action === 'next') {
      const targetElement = document.querySelector(thirdTutorialSteps[index].target);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

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

    if (Tutorial && !tutorialCompleted) {
      setRunFirstTutorial(true);
    }

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
        <h3 className='library-start'>{t("What do you want to learn?")}</h3>
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
          {Tutorial && !tutorialCompleted && (
            <div
              className='tutorial-library'
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between', // Ensures icon stays at the top and text at the bottom
                textAlign: 'center',
                backgroundColor: 'var(--accent-50)',
                padding: '16px',
                width: '100%',
                height: '100%',
                borderRadius: '8px'
              }}
            >
              <img
                src='iconassets/Tutorial.png'
                alt='Tutorial'
                style={{ 
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain', 
                  margin: 'auto', 
                  padding: '5px',
                  borderRadius: '8px'
                }}
              />
              <IonLabel style={{ fontSize: '16px', marginTop: '10px', fontWeight: '600' }}>
                Tutorial
              </IonLabel>

              <Joyride 
                steps={firstTutorialSteps}
                run={runFirstTutorial}
                continuous
                showSkipButton
                callback={handleJoyrideCallback}
                styles={{
                  options: {
                    arrowColor: 'var(--accent-100)',
                    backgroundColor: 'var(--accent-100)',
                    primaryColor: 'var(--primary-300)',
                    textColor: 'var(--text)',
                  },
                }}
              />
            </div>
          )}
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
                backgroundColor: 'var(--accent-50)',
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
                  borderRadius: '8px'
                }}
              />
              <IonLabel style={{ fontSize: '16px', marginTop: '10px', fontWeight: '600' }}>
                {option.label}
              </IonLabel>
            </div>
          ))}
        </div>

        <p>{t("We are not affiliated with any of the apps shown.")}</p>
      </IonContent>

      <IonModal isOpen={isTutorialCategoriesOpen} onDidDismiss={closeTutorialCategories}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Tutorial</IonTitle>
            <IonButtons slot="end" onClick={closeTutorialCategories}>
              <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
          <IonContent style={{ textAlign: 'center' }}>
            <h3>{t("What do you want to learn?")}</h3>
            <div
              className='tutorial-category'
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)', // 2 columns
                gap: '16px', // space between items
                justifyItems: 'center', // center items horizontally
                alignItems: 'center', // center items vertically
                padding: '16px'
              }}
            >
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between', // Ensures icon stays at the top and text at the bottom
                  textAlign: 'center',
                  backgroundColor: 'var(--accent-50)',
                  padding: '16px',
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px'
                }}
              >
                <img
                  src='iconassets/Tutorial.png'
                  alt='Tutorial'
                  style={{ 
                    width: '80px',
                    height: '80px',
                    objectFit: 'contain', 
                    margin: 'auto', 
                    padding: '5px',
                    borderRadius: '8px'
                  }}
                />
                <IonLabel style={{ fontSize: '16px', marginTop: '10px', fontWeight: '600' }}>
                  Tutorial
                </IonLabel>
              </div>
            </div>

            <Joyride 
              steps={secondTutorialSteps}
              run={runSecondTutorial}
              continuous
              showSkipButton
              callback={handleJoyrideCallback2}
              styles={{
                options: {
                  arrowColor: 'var(--accent-100)',
                  backgroundColor: 'var(--accent-100)',
                  primaryColor: 'var(--primary-300)',
                  textColor: 'var(--text)',
                },
              }}
            />

          </IonContent>
      </IonModal>

      <IonModal isOpen={isTutorialVideosOpen} onDidDismiss={closeTutorialVideos}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Tutorial Library</IonTitle>
            <IonButtons slot="end" onClick={closeTutorialVideos}>
              <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
            </IonButtons>
          </IonToolbar>
          <IonToolbar>
            <IonSearchbar
              placeholder="Look for a tutorial"
              value={searchQuery}
              onIonInput={(e) => setSearchQuery(e.detail.value!)}
              className="search-bar"
            />
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonGrid>
            <IonRow>
              <IonCol size="12" className="first-tutorial-card">
                <IonCard style={{ backgroundColor: 'var(--accent-50)', borderRadius: '15px', overflow: 'hidden' }}>
                  <IonCardHeader>
                    <IonCardTitle className='video-title'>How to use ElderGuide</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p className='video-app'>ElderGuide</p>
                    <LazyLoadComponent>
                      <center>
                        <iframe
                          className='video'
                          title="YouTube Video Player"
                          width="100%"
                          height="100%"
                          src="https://www.youtube.com/embed/At8v_Yc044Y?si=gJ6t5Q3Eh0ukpO4z"  // Adjust for single video
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </center>
                    </LazyLoadComponent>
                    <IonButton className='video-button' href="https://www.youtube.com/embed/At8v_Yc044Y?si=gJ6t5Q3Eh0ukpO4z" target="_blank" style={{ margin: '0px', borderRadius: '30px', overflow: 'hidden' }}>{t("Watch video")}</IonButton>
                    <IonButton className='video-unfav' style={{ borderRadius: '30px', overflow: 'hidden' }}>
                      <IonIcon icon={heart} /> Unfavorite
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" className="second-tutorial-card">
                <IonCard style={{ backgroundColor: 'var(--accent-50)', borderRadius: '15px', overflow: 'hidden' }}>
                  <IonCardHeader>
                    <IonCardTitle>How to use ElderGuide</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>ElderGuide</p>
                    <LazyLoadComponent>
                      <center>
                        <iframe
                          title="YouTube Video Player"
                          width="100%"
                          height="100%"
                          src="https://www.youtube.com/embed/At8v_Yc044Y?si=gJ6t5Q3Eh0ukpO4z"  // Adjust for single video
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </center>
                    </LazyLoadComponent>
                    <IonButton href="https://www.youtube.com/embed/At8v_Yc044Y?si=gJ6t5Q3Eh0ukpO4z" target="_blank" style={{ margin: '0px', borderRadius: '30px', overflow: 'hidden' }}>{t("Watch video")}</IonButton>
                    <IonButton className='video-fav' style={{ borderRadius: '30px', overflow: 'hidden' }}>
                      <IonIcon icon={heartOutline} /> Favorite
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          <Joyride 
            steps={thirdTutorialSteps}
            run={runThirdTutorial}
            continuous
            showSkipButton
            callback={handleJoyrideCallback3}
            styles={{
              options: {
                arrowColor: 'var(--accent-100)',
                backgroundColor: 'var(--accent-100)',
                primaryColor: 'var(--primary-300)',
                textColor: 'var(--text)',
              },
            }}
          />

        </IonContent>
      </IonModal>

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
                    backgroundColor: 'var(--accent-50)',
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
                    }}
                  />
                  <IonLabel style={{ fontSize: '16px', marginTop: '10px', fontWeight: '600' }}>
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
                      <IonCard key={index} style={{ backgroundColor: 'var(--accent-50)', borderRadius: '15px', overflow: 'hidden' }}>
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
                    <IonCard style={{ backgroundColor: 'var(--accent-50)', borderRadius: '15px', overflow: 'hidden' }}>
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
                <p>{t("No tutorials available for your language or search term.")}</p>
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
