import React, { useState, useEffect } from 'react';
import { IonIcon, IonModal, IonList, IonItem, IonLabel, IonButton, IonRouterLink, IonButtons, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import { notificationsOutline, closeOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

import i18n from './i18n';
import { useTranslation } from 'react-i18next';

const Notifications: React.FC = () => {
  const { t } = useTranslation();

  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const storedPhoneNumber = localStorage.getItem('phoneNumber');

  // Custom hardcoded notifications
  const customNotifications = [
    {
      id: 'custom1',
      date: new Date("2024-09-16T10:30:00").getTime(), // Use timestamp for comparison
      formattedDate: new Date("2024-09-16T10:30:00").toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      title: t('System Maintenance'),
      message: t('Scheduled system maintenance is happening tomorrow.'),
      type: 'system',
    },
    {
      id: 'custom2',
      date: new Date("2024-04-11T10:30:00").getTime(), // Use timestamp for comparison
      formattedDate: new Date("2024-04-11T10:30:00").toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      title: t('New Feature'),
      message: t('Check out the new feature we just added!'),
      type: 'info',
    },
    {
      id: 'custom3',
      date: new Date("2024-01-11T10:30:00").getTime(), // Use timestamp for comparison
      formattedDate: new Date("2024-01-11T10:30:00").toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      title: t('Test feature'),
      message: t('Check out the new feature we just added!'),
      type: 'info',
    },
  ];

  // Helper function to check if a date is 1 day away
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

          const language = userData.language || 'english';
          i18n.changeLanguage(language.toLowerCase());

          const newNotifications = await Promise.all(
            Object.keys(userRequests).map(async (key) => {
              const requestData = userRequests[key];

              if (requestData !== 'Completed') {
                const remarksForRequest = userRemarks[key];

                if (isOneDayAway(key)) {
                  return {
                    id: key,
                    date: new Date(key).getTime(), // Use timestamp for comparison
                    formattedDate: formatDate(key),
                    title: t('Upcoming request'),
                    message: t(`Your event "`) + remarksForRequest + t(`" is happening in 1 day.`),
                    type: 'reminder',
                  };
                }
                return null;
              } else {
                return null;
              }
            })
          );

          const filteredNotifications = newNotifications.filter(notification => notification !== null);

          // Combine Firebase notifications with custom ones
          const allNotifications = [...customNotifications, ...filteredNotifications];

          // Sort notifications by date (latest first)
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

  return (
    <>
      <IonButton fill="clear" onClick={() => setShowModal(true)} slot="end">
        <IonIcon style={{ fontSize: '42px', color: 'white' }} icon={notificationsOutline} />
      </IonButton>

      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar color="danger">
            <IonTitle>{t('Notifications')}</IonTitle>
            <IonButtons slot="end" onClick={() => setShowModal(false)}>
              <IonIcon icon={closeOutline} style={{ fontSize: '42px' }} />
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonList style={{ height: '100%', padding: '0px' }} inset={true}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <IonItem key={notification.id} detail={false}>
                <IonLabel>
                  <h1>{notification.title}</h1>
                  <h2><strong>{notification.formattedDate}</strong></h2>
                  <h2>{notification.message}</h2>
                  {notification.type === 'reminder' && (
                    <IonRouterLink href="/tabs/elderlyrequests">
                      <h3 style={{ color: 'blue' }}>{t('Click here to view the request details')}</h3>
                    </IonRouterLink>
                  )}
                </IonLabel>
              </IonItem>
            ))
          ) : (
            <IonItem>
              <IonLabel>{t('No notifications')}</IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonModal>
    </>
  );
};

export default Notifications;
