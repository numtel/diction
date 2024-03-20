import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

import useLocalStorage from './useLocalStorage.jsx';

const useSpeechBlobs = (volumeThreshold, silenceDuration, playing, onNewBlob) => {
  const [ APIKey ] = useLocalStorage('OPENAI_API_KEY', '');
  const [status, setStatus] = useState('');
  const [paused, setPaused] = useState(false);

  // Using refs to track the current state that may change over time and needs to be accessed in event handlers
  const recordingRef = useRef(false);
  const pausedRef = useRef(false);
  const silenceStartRef = useRef(0);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    pausedRef.current = paused || playing;
  }, [paused, playing]);

  const startRecording = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(512, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.destination);

        const mediaRecorder = new MediaRecorder(stream);
        recordedChunksRef.current = [];

        processor.onaudioprocess = function(event) {
          const input = event.inputBuffer.getChannelData(0);
          let sum = 0.0;
          for (let i = 0; i < input.length; ++i) {
            sum += input[i] * input[i];
          }
          const volume = Math.sqrt(sum / input.length);

          if (volume > volumeThreshold && !recordingRef.current && !pausedRef.current) {
            recordingRef.current = mediaRecorder;
            mediaRecorder.start();
            setStatus('Recording started');
            toast.dismiss();
            toast('Recording...');
          } else if (volume <= volumeThreshold && recordingRef.current) {
            if (silenceStartRef.current === 0) silenceStartRef.current = Date.now();
            else if ((Date.now() - silenceStartRef.current) > silenceDuration) {
              mediaRecorder.stop();
              recordingRef.current = false;
              toast.dismiss();
              toast('Waiting for dictation...');
              silenceStartRef.current = 0;
            }
          } else if (volume > volumeThreshold && recordingRef.current) {
            silenceStartRef.current = 0; // reset silence timer
          }
        };

        mediaRecorder.ondataavailable = function(event) {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async function() {
          const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const blobProps = {
            blob: audioBlob,
            transcriptionPromise: loadTranscription(audioBlob, APIKey),
            audio: new Audio(audioUrl),
          };
          onNewBlob(blobProps);
          // Clear recorded chunks after blob is created
          recordedChunksRef.current = [];
        };

        setStatus('Idle');
        toast.dismiss();
        toast('Waiting for dictation...');
      })
      .catch(error => {
        console.error('Error accessing the microphone', error);
        setStatus('Error');
        toast.dismiss();
        toast.error('Microphone error!');
      });
  }, [volumeThreshold, silenceDuration, APIKey]);

  // Cleanup function to stop recording and release resources when the component using this hook unmounts
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        // Properly stop recording and release resources here
        recordingRef.current.stop();
      }
    };
  }, []);

  return {
    status,
    startRecording,
    paused,
    setPaused,
  };
};

export default useSpeechBlobs;


// TODO retry on failure, or when internet access returns
async function loadTranscription(blob, APIKey) {
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("model", "whisper-1");

  const response = await fetch(
    'https://api.openai.com/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${APIKey}`,
      },
      body: formData
    }
  );
  const parsed = await response.json();
  return parsed.text;
};
