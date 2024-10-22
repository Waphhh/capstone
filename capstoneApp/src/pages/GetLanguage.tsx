import { doc, getDoc } from 'firebase/firestore'; // Ensure you import necessary Firebase functions
import i18n from 'i18next'; // Adjust import based on your i18n setup

// Exportable function to fetch user language
export const fetchUserLanguage = async (db) => {
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  
  if (storedPhoneNumber) {
    const userDoc = doc(db, 'users', storedPhoneNumber); // Reference to user document
    const userSnapshot = await getDoc(userDoc); // Fetch user document
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      const language = userData.language || 'english'; // Default to 'english' if no language found
      i18n.changeLanguage(language.toLowerCase()); // Set the language for i18next
      return true; // Indicate successful loading
    }
  }
  
  return false; // Indicate loading failed (e.g., no stored phone number)
};
