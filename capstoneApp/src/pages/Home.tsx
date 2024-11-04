import React, { useEffect, useRef, useState } from 'react';
import { IonPage, IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonContent, IonButton, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import { db } from './firebaseConfig';
import TabsToolbar from './TabsToolbar';
import { fetchUserLanguage } from './GetLanguage';
import Notifications from './Notifications';
import { useHistory, useLocation } from 'react-router-dom';
import { peopleOutline, settingsOutline, bookOutline } from 'ionicons/icons';

import 'swiper/css';
import 'swiper/css/pagination';
import './Home.css';

const Home: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation

  const [loading, setLoading] = useState<boolean>(true);
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const location = useLocation();
  const history = useHistory();

  const recommended = [
    { id: 1, label: 'WhatsApp', src: 'Whatsapp.png'},
    { id: 2, label: 'Facebook', src: 'Facebook.png'},
    { id: 3, label: 'Youtube', src: 'Youtube.png'},
    { id: 4, label: 'E-payment', src: 'e-payment.png'},
  ];

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

  const handleRequest = () => {
    localStorage.setItem('immediateRequest', 'true');
    navigateTo('/tabs/elderlyrequests');
  }

  useEffect(() => {
    const loadUserLanguage = async () => {
      const success = await fetchUserLanguage(db); // Call the function and await its result
      setLoading(!success); // Set loading to true if fetching failed, false if successful
    };

    loadUserLanguage();
  }, [db, location]);

  if (loading) return <p>{t("Loading...")}</p>;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{t("Home")}</IonTitle>
          <Notifications />
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ textAlign: 'center' }} className='ion-padding'>

        <img 
          src="https://raw.githubusercontent.com/Waphhh/capstone/c250ac508f5e28150149f9d405e9f348cca6363e/capstoneApp/public/Home.gif" 
          alt="Home GIF"
          style={{ width: '100%', border: 'solid var(--primary-200) 1px', padding: '0px', borderRadius: '8px'}} 
        />

        <div className="custom-toolbar">
          <div className="custom-tab" onClick={() => handleRequest()}>
            <div className="icon-circle">
              <IonIcon icon={peopleOutline} />
            </div>
            <IonLabel>{t("Requests")}</IonLabel>
          </div>

          <div className="custom-tab" onClick={() => navigateTo('/tabs/library')}>
            <div className="icon-circle">
              <IonIcon icon={bookOutline} />
            </div>
            <IonLabel>{t("Library")}</IonLabel>
          </div>

          <div className="custom-tab" onClick={() => navigateTo('/tabs/settings')}>
            <div className="icon-circle">
              <IonIcon icon={settingsOutline} />
            </div>
            <IonLabel>{t("Settings")}</IonLabel>
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
                <IonCard button={true} onClick={handleSlideClick} style={{ backgroundColor: 'var(--accent-50)', height: 'auto', padding: '20px' }}>
                  <IonCardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img
                      src={`iconassets/${src}`}
                      alt={`Icon for ${label}`}
                      style={{ width: '100px', height: '100px', marginBottom: '20px', objectFit: 'contain' }}
                    />
                    <h3 style={{ fontSize: '24px', textAlign: 'center', color: 'var(--text)', fontWeight: '600' }}>{label}</h3>
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
