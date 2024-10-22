import React, { useEffect } from 'react';
import { IonToolbar, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { Route } from 'react-router-dom';
import { homeOutline, peopleOutline, bookOutline, settingsOutline } from 'ionicons/icons';
import { db } from './firebaseConfig';
import { fetchUserLanguage } from './GetLanguage';
import { useTranslation } from 'react-i18next';

const TabsToolbar: React.FC = () => {
  const { t } = useTranslation();

  useEffect(() => {
    fetchUserLanguage(db);
  }, [db]);

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
            <IonLabel>{t("Home")}</IonLabel>
          </IonTabButton>

          <IonTabButton tab="history" href="/tabs/elderlyrequests">
            <IonIcon icon={peopleOutline} style={{ fontSize: '28px' }} />
            <IonLabel>{t("Requests")}</IonLabel>
          </IonTabButton>

          <IonTabButton tab="library" href="/tabs/library">
            <IonIcon icon={bookOutline} style={{ fontSize: '28px' }} />
            <IonLabel>{t("Library")}</IonLabel>
          </IonTabButton>

          <IonTabButton tab="settings" href="/tabs/settings">
            <IonIcon icon={settingsOutline} style={{ fontSize: '28px' }} />
            <IonLabel>{t("Settings")}</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonToolbar>
  );
};

export default TabsToolbar;
