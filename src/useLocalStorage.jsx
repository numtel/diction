import { useState, useEffect } from 'react';

// Custom event type for internal updates
const localStorageChangedEvent = 'local-storage-changed';

export default function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      // Dispatch custom event to signal that local storage has been updated
      window.dispatchEvent(new CustomEvent(localStorageChangedEvent, { detail: { key, value: valueToStore } }));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key) {
        try {
          const item = window.localStorage.getItem(key);
          setStoredValue(item ? JSON.parse(item) : initialValue);
        } catch (error) {
          console.log(error);
        }
      }
    };

    const handleCustomStorageChange = (event) => {
      if (event.detail.key === key) {
        try {
          setStoredValue(event.detail.value);
        } catch (error) {
          console.log(error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(localStorageChangedEvent, handleCustomStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(localStorageChangedEvent, handleCustomStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}

