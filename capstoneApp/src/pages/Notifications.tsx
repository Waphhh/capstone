import React, { useState, useEffect } from 'react';
import {
  IonIcon,
  IonModal,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonRouterLink,
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { notificationsOutline, closeOutline, informationCircleOutline, warningOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useTranslation } from 'react-i18next';
import { fetchUserLanguage } from './GetLanguage';
import Joyride, { Step } from 'react-joyride';

const Notifications: React.FC = () => {
  const { t } = useTranslation();

  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showTutorial, setShowTutorial] = useState(false); // Controls when the tutorial starts
  const storedPhoneNumber = localStorage.getItem('phoneNumber');

  const Tutorial = localStorage.getItem("Tutorial");
  const tutorialCompleted = localStorage.getItem("tutorialCompletedNotifications");

  const steps: Step[] = [
    {
      target: '.notification-bell', // Add a CSS class to target the notification bell
      content: t('Click here to view your notifications.'),
      placement: 'bottom',
    },
    {
      target: '.notification-modal', // Add a CSS class to target the notifications modal
      content: t('Here you can see your recent notifications.'),
      placement: 'top',
    }
  ];

  const customNotifications = [
    {
      id: 'custom1',
      date: new Date("2024-09-16T10:30:00").getTime(),
      formattedDate: new Date("2024-09-16T10:30:00").toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      title: t('System Maintenance'),
      message: t('Scheduled system maintenance is happening tomorrow.'),
      type: 'system',
      icon: warningOutline,
    },
    {
      id: 'custom2',
      date: new Date("2024-04-11T10:30:00").getTime(),
      formattedDate: new Date("2024-04-11T10:30:00").toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      title: t('New Feature'),
      message: t('Check out the new feature we just added!'),
      type: 'info',
      icon: informationCircleOutline,
    },
  ];

  const isOneDayAway = (date: string) => {
    const requestDate = new Date(date);
    const currentDate = new Date();
    const timeDiff = requestDate.getTime() - currentDate.getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return timeDiff >= 0 && timeDiff <= oneDayInMs;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const fetchOngoingRequests = async () => {
    try {
      if (storedPhoneNumber) {
        const docRef = doc(db, 'users', storedPhoneNumber);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const userRequests = userData.requests || {};
          const userRemarks = userData.remarks || {};

          const newNotifications = await Promise.all(
            Object.keys(userRequests).map(async (key) => {
              const requestData = userRequests[key];

              if (requestData !== 'Completed') {
                const remarksForRequest = userRemarks[key];

                if (isOneDayAway(key)) {
                  return {
                    id: key,
                    date: new Date(key).getTime(),
                    formattedDate: formatDate(key),
                    title: t('Upcoming request'),
                    message: `${t('Your event "')}${remarksForRequest}${t('" is happening in 1 day.')}`,
                    type: 'reminder',
                    icon: notificationsOutline,
                  };
                }
                return null;
              } else {
                return null;
              }
            })
          );

          const filteredNotifications = newNotifications.filter((notification) => notification !== null);

          const allNotifications = [...customNotifications, ...filteredNotifications];
          allNotifications.sort((a, b) => b.date - a.date);

          setNotifications(allNotifications);
        } else {
          console.log('No such document!');
        }
      } else {
        console.log('Phone number not found in localStorage');
      }
    } catch (error) {
      console.error('Error fetching ongoing requests:', error);
    }
  };

  useEffect(() => {
    fetchOngoingRequests();
  }, [storedPhoneNumber]);

  useEffect(() => {
    fetchUserLanguage(db);

    if (Tutorial && !tutorialCompleted) {
      setShowTutorial(true);
    }

  }, [db]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      setShowTutorial(false);
      localStorage.setItem("tutorialCompletedNotifications", "true");
    }
  };

  return (
    <>
      {/* Joyride component for the tutorial */}
      <Joyride
        steps={steps}
        continuous
        showSkipButton
        styles={{
          options: {
            arrowColor: 'var(--accent-100)',
            backgroundColor: 'var(--accent-100)',
            primaryColor: 'var(--primary-300)',
            textColor: 'var(--text)',
          },
        }}
        run={showTutorial} // Controls when the tutorial runs
        callback={handleJoyrideCallback} // Set the callback
      />

      <IonButton fill="clear" onClick={() => setShowModal(true)} slot="end" className="notification-bell">
        <IonIcon style={{ fontSize: '42px', color: 'white' }} icon={notificationsOutline} />
      </IonButton>

      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} className="notification-modal">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>{t('Notifications')}</IonTitle>
            <IonButtons slot="end" onClick={() => setShowModal(false)}>
              <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <div style={{ padding: '16px', height: '100%' }}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <IonCard key={notification.id} style={{ border: 'solid 1px var(--primary-200)', backgroundColor: 'var(--accent-50)' }}>
                <IonCardHeader>
                  <IonCardTitle>
                    <strong>{notification.title}</strong>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 style={{ paddingBottom: '10px' }}><strong>{notification.formattedDate}</strong></h2>
                  <h2>{notification.message}</h2>
                  {notification.type === 'reminder' && (
                    <IonRouterLink href="/tabs/elderlyrequests">
                      <h2 style={{ color: 'blue' }}>{t('Click here to view the request details')}</h2>
                    </IonRouterLink>
                  )}
                </IonCardContent>
              </IonCard>
            ))
          ) : (
            <p>{t('No notifications')}</p>
          )}
        </div>
      </IonModal>
    </>
  );
};

export default Notifications;
