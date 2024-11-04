import React, { useEffect, useState } from 'react';
import {
  IonToolbar,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/react';
import { Route, useLocation } from 'react-router-dom'; // Import useLocation
import { homeOutline, peopleOutline, bookOutline, settingsOutline } from 'ionicons/icons';
import { db } from './firebaseConfig';
import { fetchUserLanguage } from './GetLanguage';
import { useTranslation } from 'react-i18next';
import Joyride, { Step } from 'react-joyride';

import './TabsToolbar.css';

const TabsToolbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation(); // Get the current route
  const [showTutorial, setShowTutorial] = useState(false); // Initial state is false

  const Tutorial = localStorage.getItem("Tutorial");
  const tutorialCompleted = localStorage.getItem("tutorialCompletedTabToolBar");

  useEffect(() => {
    fetchUserLanguage(db);
    // Start the tutorial if we're on the homepage
    if (location.pathname === '/tabs/home' && Tutorial && !tutorialCompleted) {
      console.log(tutorialCompleted);
      setShowTutorial(true);
    }
  }, [location.pathname, db]);

  // Define the tutorial steps for each tab
  const steps: Step[] = [
    {
      target: '.tab-home',
      content: t('This is the Home tab, where you can access the main dashboard.'),
      placement: 'top',
    },
    {
      target: '.tab-history',
      content: t('Here you can view all your requests.'),
      placement: 'top',
    },
    {
      target: '.tab-library',
      content: t('Explore resources in the Library tab.'),
      placement: 'top',
    },
    {
      target: '.tab-settings',
      content: t('Use the Settings tab to configure your preferences.'),
      placement: 'top',
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      setShowTutorial(false);
      localStorage.setItem("tutorialCompletedTabToolBar", "true")
    }
  };

  return (
    <>
      {/* Joyride component for the tutorial */}
      {showTutorial && (
        <Joyride
          steps={steps}
          continuous
          showSkipButton
          showProgress
          styles={{
            options: {
              arrowColor: 'var(--accent-100)',
              backgroundColor: 'var(--accent-100)',
              primaryColor: 'var(--primary-300)',
              textColor: 'var(--text)',
            },
          }}
          locale={{
            back: t('Back'),
            close: t('Close'),
            last: t('Finish'),
            next: t('Next'),
            skip: t('Skip')
          }}
          run={showTutorial}
          callback={handleJoyrideCallback} // Set the callback
        />
      )}

      {/* Main toolbar and tabs */}
      <IonToolbar>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/tabs/home" exact={true} />
            <Route path="/tabs/elderlyrequests" exact={true} />
            <Route path="/tabs/library" exact={true} />
            <Route path="/tabs/settings" exact={true} />
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton className="tab-home" tab="home" href="/tabs/home">
              <IonIcon icon={homeOutline} style={{ fontSize: '28px' }} />
              <IonLabel>{t("Home")}</IonLabel>
            </IonTabButton>

            <IonTabButton className="tab-history" tab="history" href="/tabs/elderlyrequests">
              <IonIcon icon={peopleOutline} style={{ fontSize: '28px' }} />
              <IonLabel>{t("Requests")}</IonLabel>
            </IonTabButton>

            <IonTabButton className="tab-library" tab="library" href="/tabs/library">
              <IonIcon icon={bookOutline} style={{ fontSize: '28px' }} />
              <IonLabel>{t("Library")}</IonLabel>
            </IonTabButton>

            <IonTabButton className="tab-settings" tab="settings" href="/tabs/settings">
              <IonIcon icon={settingsOutline} style={{ fontSize: '28px' }} />
              <IonLabel>{t("Settings")}</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonToolbar>
    </>
  );
};

export default TabsToolbar;
