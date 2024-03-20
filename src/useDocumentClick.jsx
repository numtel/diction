import { useEffect } from 'react';

// Custom hook definition
const useDocumentClick = (handler) => {
  useEffect(() => {
    // Function to handle the click event
    const handleClick = (event) => {
      // Check if the click was on a transcription
      if (!event.target.classList.contains('transcription')) {
        // Call the handler passed to the hook if the click is on the document's background
        handler(event);
      }
    };

    // Attach the event listener to the document
    document.addEventListener('click', handleClick);

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [handler]); // Effect dependencies array, re-attach if handler changes
};

export default useDocumentClick;

