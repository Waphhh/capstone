import React, { useRef } from 'react';
import { IonPage, IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonContent, IonButton } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import TabsToolbar from './TabsToolbar';

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
                <IonCard button={true} onClick={handleSlideClick}>
                  <IonCardContent>
                    <h3>{item}</h3>
                  </IonCardContent>
                </IonCard>
              </SwiperSlide>
            ))}
          </Swiper>
        </IonGrid>

        <IonRow style={{ textAlign: 'center', marginTop: '20px'}} className='content-border'>
          <IonCol size="12">
            <h2>Library not helpful enough, go request for volunteer help</h2>
            <IonButton expand="full" shape='round' routerLink="elderlyrequests">Request Help</IonButton>
          </IonCol>
        </IonRow>
        
      </IonContent>

      <TabsToolbar />

    </IonPage>
  );
};

export default Home;
