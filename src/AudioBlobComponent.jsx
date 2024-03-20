import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// TODO allow editing transcription
// TODO button to correct a transcription by reading a prompt from another audio blob
const AudioBlobComponent = ({
  index,
  blob,
  transcriptionPromise,
  audio,
  active,
  removeItem,
  setCursor,
  play,
  stop,
}) => {
  const [transcription, setTranscription] = useState();
  const [loadingTranscription, setLoadingTranscription] = useState(true);

  useEffect(() => {
    setLoadingTranscription(true);
    transcriptionPromise.then(result => {
      setTranscription(result);
      setLoadingTranscription(false);
    }, error => {
      toast.dismiss();
      toast.error('Transcription Error!');
    });
  }, [transcriptionPromise]);

  return (
    <span className={`blob ${active ? 'active' :''}`} onClick={(event) => {
      play(index);
      setCursor(index);
    }}>
      <span className="controls">
        <button onClick={(e) => {
          e.stopPropagation();
          stop();
          removeItem(index);
        }}>Delete</button>
      </span>
      {loadingTranscription
        ? <span className="transcription loading">Loading transcription...</span>
        : <span className="transcription">{transcription}</span>}
    </span>
  );
};

export default AudioBlobComponent;

