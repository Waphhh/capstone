import React, { useEffect, useRef, useState } from 'react';
import { IonPage, IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonContent, IonButton, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import TabsToolbar from './TabsToolbar';
import i18n from './i18n';
import { useHistory } from 'react-router-dom';
import { peopleOutline, settingsOutline, libraryOutline } from 'ionicons/icons';

import 'swiper/css';
import 'swiper/css/pagination';
import './Home.css';

const Home: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation
  const [loading, setLoading] = useState<boolean>(true);
  const history = useHistory();

  const recommended = [
    { id: 1, label: 'WhatsApp', src: 'Whatsapp.png'},
    { id: 2, label: 'Facebook', src: 'Facebook.png'},
    { id: 3, label: 'Youtube', src: 'Youtube.png'},
    { id: 4, label: 'E-payment', src: 'e-payment.png'},
  ];

  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  
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

  // Create a ref to get access to the Swiper instance
  const swiperRef = useRef<any>(null);

  const handleSlideClick = () => {
    // Ensure swiperRef is defined before calling slideNext
    if (swiperRef.current) {
      swiperRef.current.slideNext();  // Directly call slideNext() on swiperRef
    }
  };

  const handleGoLearn = (label: string) => {
    localStorage.setItem('recommendedItem', label); // Store the label in local storage
  };

  const navigateTo = (path: string) => {
    history.push(path);
  };

  if (loading) return <p>{t("Loading...")}</p>;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>{t("Home")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ textAlign: 'center' }} className='ion-padding'>

        {/* Add the GIF here */}
        <img 
          src="./Home.gif" // Replace this with the actual path or URL to your GIF
          alt="Home GIF"
          style={{ width: '100%', border: 'solid #e8e8e8 1px', padding: '0px', borderRadius: '8px'}} 
        />

        <div className="custom-toolbar">
          <div className="custom-tab" onClick={() => navigateTo('/tabs/elderlyrequests')}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 4px 2px rgba(0, 0, 0, 0.1)' }}>
              <IonIcon icon={peopleOutline} style={{ fontSize: '30px' }} />
            </div>
            <IonLabel style={{ padding: '10px', fontSize: '12px' }}>{t("Requests")}</IonLabel>
          </div>

          <div className="custom-tab" onClick={() => navigateTo('/tabs/library')}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 4px 2px rgba(0, 0, 0, 0.1)' }}>
              <IonIcon icon={libraryOutline} style={{ fontSize: '30px' }} />
            </div>
            <IonLabel style={{ padding: '10px', fontSize: '12px' }}>{t("Library")}</IonLabel>
          </div>

          <div className="custom-tab" onClick={() => navigateTo('/tabs/settings')}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 4px 2px rgba(0, 0, 0, 0.1)' }}>
              <IonIcon icon={settingsOutline} style={{ fontSize: '30px' }} />
            </div>
            <IonLabel style={{ padding: '10px', fontSize: '12px' }}>{t("Settings")}</IonLabel>
          </div>
        </div>

        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <h1>{t("Hot apps")}</h1>
            </IonCol>
          </IonRow>

          <Swiper
            modules={[Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            loop={true}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
          >
            {recommended.map(({ id, label, src }) => (
              <SwiperSlide key={id}>
                <IonCard button={true} onClick={handleSlideClick} style={{ backgroundColor: '#d8d8d8', height: 'auto', padding: '20px' }}>
                  <IonCardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img
                      src={`iconassets/${src}`}
                      alt={`Icon for ${label}`}
                      style={{ width: '100px', height: '100px', marginBottom: '10px', objectFit: 'contain', backgroundColor: 'white', borderRadius: '8px', padding: '10px' }}
                    />
                    <h3 style={{ fontSize: '24px', textAlign: 'center' }}>{label}</h3>
                    <IonButton
                      expand="full"
                      shape='round'
                      onClick={() => handleGoLearn(label)}
                      routerLink="/tabs/library"
                      style={{ marginTop: '20px' }}
                    >
                      {t("Go learn")}
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </SwiperSlide>
            ))}
          </Swiper>
        </IonGrid>

        <IonRow style={{ textAlign: 'center' }}>
          <IonCol size="12">
            <h2>{t("Cannot find what you are looking for in the video library?")}</h2>
            <h2>{t("Request assistance from a volunteer.")}</h2>
            <IonButton expand="full" shape='round' routerLink="elderlyrequests">{t("Request Help")}</IonButton>
          </IonCol>
        </IonRow>
        
      </IonContent>

      <TabsToolbar />

    </IonPage>
  );
};

export default Home;
