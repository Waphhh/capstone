import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonIcon,
  IonFooter,
  IonLabel,
} from '@ionic/react';
import { micOutline, homeOutline, settingsOutline, peopleOutline, giftOutline } from 'ionicons/icons';
import './Home.css'; // Add your custom styles

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>Home page</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>

          {/* Welcome Section */}
          <IonRow>
            <IonCol>
              <div className="welcome-card">
                <img src="path_to_logo" alt="Logo" className="logo" />
                <h2>Welcome</h2>
                <IonLabel className="subtitle">Hot Apps</IonLabel>
                <p>Apps that would be useful for you!</p>
                <IonButton fill="solid" color="danger" size="small">
                  Read more
                </IonButton>
              </div>
            </IonCol>
          </IonRow>

          {/* Ongoing Requests */}
          <IonRow>
            <IonCol>
              <IonCard className="ongoing-requests-card">
                <IonCardHeader>
                  <IonCardTitle>Ongoing Requests</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p className="request-item">
                    <span>Recorded Request 1: Google maps</span>
                    <IonLabel className="accepted-label">Accepted</IonLabel>
                  </p>
                  <p className="request-item">
                    <span>Recorded Request 2: YouTube</span>
                    <IonLabel className="pending-label">Pending</IonLabel>
                  </p>
                  <IonButton fill="clear" className="expand-button">▼</IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* Rate Previous Volunteers */}
          <IonRow>
            <IonCol size="6">
              <IonCard className="volunteer-card">
                <img src="path_to_image" alt="Volunteer" />
                <IonCardContent>
                  Helped you set up Google
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard className="volunteer-card">
                <img src="path_to_image" alt="Volunteer" />
                <IonCardContent>
                  Helped you learn YouTube, Candy Crush, and Roblox
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Floating Action Button (Recording) */}
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton color="danger">
            <IonIcon icon={micOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      {/* Bottom Navigation */}
      <IonFooter>
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/home">
                  <IonIcon icon={homeOutline} />
                </IonButton>
              </IonCol>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/requests">
                  <IonIcon icon={peopleOutline} />
                </IonButton>
              </IonCol>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/rewards">
                  <IonIcon icon={giftOutline} />
                </IonButton>
              </IonCol>
              <IonCol className="ion-text-center">
                <IonButton fill="clear" routerLink="/settings">
                  <IonIcon icon={settingsOutline} />
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Home;
