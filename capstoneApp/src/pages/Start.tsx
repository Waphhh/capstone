import { IonContent, IonPage, IonButton } from '@ionic/react';
import './Start.css';

const Start: React.FC = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="container">
          <img
            src="./StartImage.jpeg" // replace with the actual image path or URL
            alt="Start Page"
            className="top-image"
          />
          <div className="bottom-text">
            <h1>Welcome to the HWN app</h1>
            <p>The HWN x SST app made by students for elderly to voice their concerns to HWN for help.</p>
            <p>If it isn't from the heart, it is not worth doing.</p>
          </div>
        </div>

        <IonButton expand="block" color="danger" routerLink="/login" className="getStartedButton">
            Get started
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Start;
