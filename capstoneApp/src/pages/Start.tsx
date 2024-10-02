import { IonContent, IonPage, IonButton } from '@ionic/react';
import './Start.css';

const Start: React.FC = () => {

  return (
    <IonPage>
      <IonContent>
        <div className="container">
          <img
            className="top-image"
            src={'./StartImage3.jpeg'}
            alt="Start Page"
          />
          <div className="bottom-text">
            <h1>Welcome to the HWN app</h1>
            <p style={{ fontSize: '16px' }}>
              The HWN x SST app made by students for elderly to voice their concerns to HWN for help.
            </p>
            <p style={{ fontSize: '16px' }}>
              If it isn't from the heart, it is not worth doing.
            </p>
          </div>

          <IonButton expand="block" color="danger" routerLink="/login" className="getStartedButton">
            Get started
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Start;
