import React, { useEffect, useState } from 'react';
import './Calendar.css'; // Import the custom CSS
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

interface CalendarProps {
  handleCalendarClick: (isoDate: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ handleCalendarClick }) => {
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const fetchAvailableTimings = async () => {
    try {
      if (storedPhoneNumber) {
        const docRef = doc(db, 'dates', 'dates');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dates = docSnap.data().dates || {};
          const temparray = Object.keys(dates).map(key => key);
  
          // Sort the available dates by earliest first
          const sortedDates = temparray.sort((a, b) => {
            return new Date(a) - new Date(b);
          });
  
          setAvailableDates(sortedDates);
        }
      } else {
        console.log('Phone number not found in localStorage');
      }
    } catch (error) {
      console.error('Error fetching available timings:', error);
    }
  };  

  const formatDate = (isoDate: string) => {
    const dateObj = new Date(isoDate);
    return dateObj.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  useEffect(() => {
    fetchAvailableTimings();
  }, [storedPhoneNumber]);

  return (
    <div className="calendar-list">
      {availableDates.length > 0 ? (
        availableDates.map((isoDate, index) => (
          <div 
            key={index} 
            className="calendar-container"
            onClick={() => handleCalendarClick(isoDate)}
          >
            <div className="calendar-top">
              <div className="calendar-day">{new Date(isoDate).getDate()}</div>
              <div className="calendar-month">{new Date(isoDate).toLocaleString('en-US', {
                month: 'short',
                hour12: true })}
              </div>
            </div>
            <div className="calendar-bottom">
              <div className="calendar-time">{formatDate(isoDate)}</div>
            </div>
          </div>
        ))
      ) : (
        <p>No available dates</p>
      )}
    </div>
  );
};

export default Calendar;
