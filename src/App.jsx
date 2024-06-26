import { useState, useRef } from 'react'
import { Toaster } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
} from '@fortawesome/free-solid-svg-icons';

import './App.css'

import useSpeechBlobs from './useSpeechBlobs.jsx';
import useLocalStorage from './useLocalStorage.jsx';
import useSortableArray from './useSortableArray.jsx';
import useDocumentClick from './useDocumentClick.jsx';
import AudioBlobComponent from './AudioBlobComponent.jsx';

// TODO sound meter
function App() {
  const [cursor, setCursor] = useState();
  const cursorRef = useRef();
  cursorRef.current = cursor;
  const [playing, setPlaying] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [ APIKey, setAPIKey ] = useLocalStorage('OPENAI_API_KEY', '');
  const { array: items, insertItem, moveItem, removeItem } = useSortableArray();
  const {
    status,
    startRecording,
    paused,
    setPaused,
  } = useSpeechBlobs(0.01, 1500, playing, (blob) => {
    if(playing) return;
    const newIndex = insertItem(blob, cursorRef.current);
    setCursor(cursor => typeof cursor === 'number' ? newIndex + 1 : undefined);
  });
  useDocumentClick(stop);

  if(!APIKey || !APIKey.match(/^sk-[0-9a-zA-Z]{47,50}$/)) return (
    <div className="init">
      <p>To begin, paste your OpenAI API Key.</p>
      <input
        type="text"
        placeholder="API Key"
        value={APIKey}
        onChange={(e) => setAPIKey(e.target.value)}
      />
    </div>
  );

  function play(index) {
    stop();
    if(index > items.length - 1) return;

    setPlaying(true);
    const audio = items[index].audio;
    audio.onended = () => {
      setCursor(cursor => {
        const stillCurrent = cursor === index;
        if(stillCurrent) {
          play(index + 1);
          return index + 1;
        } else return cursor;
      });
    };
    audio.fastSeek(0);
    audio.play().catch(error => console.error('Playback failed', error));
  }

  function stop() {
    setPlaying(false);
    for(let item of items) {
      item.audio.onended = undefined;
      item.audio.pause();
    }
  }

  function onDragOver(id) {
    // If the item is dragged over itself, ignore
    if (draggedItemId === id) {
      return;
    }
    const draggedItem = items.findIndex(item => item.url === draggedItemId);
    const droppedOnItemIndex = items.findIndex(item => item.url === id);
    moveItem(draggedItem, droppedOnItemIndex);
  }

  function onTouchMove(e) {
    const touchLocation = e.targetTouches[0];
    const targetElement = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);
    if (targetElement && targetElement.closest('li').getAttribute("data-id")) {
      const id = targetElement.closest('li').getAttribute("data-id");
      onDragOver(id);
    }
  }

  return (
    <>
      <Toaster position="bottom-center" />
      <div className="toolbar">
        <button onClick={() => {
            if(!status) startRecording();
            else {
              setPaused(!paused);
            }
          }}
          className={`${playing ? 'playing' : ''} ${status && !paused ? 'recording' : 'idle'}`}
        >{!status ? (<>
          <FontAwesomeIcon icon={faMicrophone} />
          Start Recording
          </>): paused ? (<>
          <FontAwesomeIcon icon={faMicrophone} />
          Continue Recording
          </>): (<>
          <FontAwesomeIcon icon={faMicrophoneSlash} />
          Pause Recording
          </>)}</button>
      </div>
      <ol className="document">
        {items.map((blob, index) => (
          <li
            key={index}
            data-id={blob.url}
            draggable
            onDragStart={() => setDraggedItemId(blob.url)}
            onDragOver={() => onDragOver(blob.url)}
            onTouchStart={() => setDraggedItemId(blob.url)}
            onTouchMove={onTouchMove}
            onTouchEnd={() => setDraggedItemId(null)}
            >
          <AudioBlobComponent
            active={cursor===index}
            {...blob} 
            {...{index, removeItem, setCursor, play, stop}}
          />
        </li>))}
      </ol>
    </>
  )
}

export default App
