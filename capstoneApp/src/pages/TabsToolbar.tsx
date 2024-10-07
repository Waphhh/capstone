import React from 'react';
import { IonToolbar, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { Route } from 'react-router-dom';
import { homeOutline, peopleOutline, bookOutline, settingsOutline } from 'ionicons/icons';

const TabsToolbar: React.FC = () => {
  return (
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
  );
};

export default TabsToolbar;
