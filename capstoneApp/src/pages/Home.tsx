import React, { useRef } from 'react';
import { IonPage, IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonLabel, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonContent, IonButton } from '@ionic/react';
import { homeOutline, settingsOutline, peopleOutline, bookOutline } from 'ionicons/icons';
import { Route } from 'react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import './Home.css';

const Home: React.FC = () => {
  const recorded = ["Recommended Item 1", "Recommended Item 2", "Recommended Item 3"];
  
  // Create a ref to get access to the Swiper instance
  const swiperRef = useRef<any>(null);

  const handleSlideClick = () => {
    // Ensure swiperRef is defined before calling slideNext
    if (swiperRef.current) {
      swiperRef.current.slideNext();  // Directly call slideNext() on swiperRef
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ textAlign: 'center' }}>
        {/* Top section for swipeable recommended items using Swiper.js */}
        <IonGrid className='content-border'>
          <IonRow>
            <IonCol size="12">
              <h1>Hot apps</h1>
            </IonCol>
          </IonRow>

          <Swiper
            modules={[Autoplay]} // Enable autoplay and pagination
            spaceBetween={20}
            slidesPerView={1}
            loop={true} // Enable infinite looping
            autoplay={{ delay: 5000, disableOnInteraction: false }} // Auto swipe every 5 seconds
            onSwiper={(swiper) => (swiperRef.current = swiper)} // Attach the Swiper instance to the ref
          >
            {recorded.map((item, index) => (
              <SwiperSlide key={index}>
                {/* The full IonCard will be clickable */}
                <IonCard button={true} onClick={handleSlideClick}>
                  <IonCardContent>
                    <h3>{item}</h3>
                  </IonCardContent>
                </IonCard>
              </SwiperSlide>
            ))}
          </Swiper>
        </IonGrid>

        {/* New section for volunteer help request */}
        <IonRow style={{ textAlign: 'center', marginTop: '20px'}} className='content-border'>
          <IonCol size="12">
            <h2>Library not helpful enough, go request for volunteer help</h2>
            <IonButton expand="full" shape='round' routerLink="elderlyrequests">Request Help</IonButton>
          </IonCol>
        </IonRow>
        
      </IonContent>

      <IonToolbar>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/tabs/home" exact={true} />
            <Route path="/tabs/elderlyrequests" exact={true} />
            <Route path="/tabs/library" exact={true} />
            <Route path="/tabs/settings" exact={true} />
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/tabs/home">
              <IonIcon icon={homeOutline} style={{ fontSize: '28px' }} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>

            <IonTabButton tab="history" href="/tabs/elderlyrequests">
              <IonIcon icon={peopleOutline} style={{ fontSize: '28px' }} />
              <IonLabel>Requests</IonLabel>
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

export default Home;
