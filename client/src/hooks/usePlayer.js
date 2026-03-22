import { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';

export function usePlayer() {
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const audioCtxRef = useRef(null);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { 
    currentIndex, playlist, volume, nextSong, setIsPlaying, isPlaying, 
    addToRecent, toggleLoop, toggleShuffle, setVolume 
  } = useStore();
  
  const currentSong = playlist[currentIndex] || null;

  // Create audio element once
  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = 'anonymous';
  }

  // Setup Visualizer Node
  const initAudioContext = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    } catch (e) {
      console.warn('[usePlayer] AudioContext failed:', e);
    }
  };

  // Auto-play when song index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentSong) return;
    
    setLoading(true);
    setError('');
    
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const streamUrl = `${apiUrl}/stream?url=${encodeURIComponent(currentSong.url)}`;
    
    addToRecent(currentSong);
    audio.pause();
    audio.src = streamUrl;
    audio.volume = volume;
    audio.load();
    
    audio.play()
      .then(() => { 
        initAudioContext();
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
        setIsPlaying(true); 
        setLoading(false); 
      })
      .catch(e => { 
        setError(e.message); 
        setLoading(false); 
        setIsPlaying(false); 
      });
  }, [currentIndex]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const onTime  = () => setPosition(Math.floor(audio.currentTime));
    const onMeta  = () => setDuration(Math.floor(audio.duration) || 0);
    const onEnd   = () => { const n = nextSong(); if (!n) setIsPlaying(false); };
    const onPlay  = () => { setIsPlaying(true); };
    const onPlaying = () => { setIsPlaying(true); setLoading(false); };
    const onWaiting = () => { setLoading(true); };
    const onPause = () => setIsPlaying(false);
    const onErr   = (e) => { setError('Playback failed'); setLoading(false); };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onErr);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onErr);
    };
  }, []);

  // Keyboard Shortcuts
  const playPause = useCallback(() => {
    const audio = audioRef.current;
    if (!currentSong) return;
    
    if (!audio.src || audio.src === window.location.href) {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const streamUrl = `${apiUrl}/stream?url=${encodeURIComponent(currentSong.url)}`;
      audio.src = streamUrl;
      audio.load();
    }

    if (audio.paused) {
      initAudioContext();
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      audio.play().catch(e => console.error(e));
    } else {
      audio.pause();
    }
  }, [currentSong]);

  const seek = useCallback((s) => {
    if (audioRef.current) {
      const target = Math.max(0, Math.min(s, audioRef.current.duration || 9999));
      audioRef.current.currentTime = target;
      setPosition(Math.floor(target));
    }
  }, []);

  const fastForward = useCallback(() => {
    if (audioRef.current) seek(audioRef.current.currentTime + 10);
  }, [seek]);

  const rewind = useCallback(() => {
    if (audioRef.current) seek(audioRef.current.currentTime - 10);
  }, [seek]);

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setIsPlaying(false);
  }, [setIsPlaying]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); playPause(); break;
        case 'arrowleft': e.preventDefault(); rewind(); break;
        case 'arrowright': e.preventDefault(); fastForward(); break;
        case 'l': toggleLoop(); break;
        case 's': toggleShuffle(); break;
        case 'arrowup': e.preventDefault(); setVolume(Math.min(1, volume + 0.1)); break;
        case 'arrowdown': e.preventDefault(); setVolume(Math.max(0, volume - 0.1)); break;
        case 'm': setVolume(volume > 0 ? 0 : 0.8); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playPause, rewind, fastForward, toggleLoop, toggleShuffle, volume, setVolume]);

  return { 
    position, 
    duration: (currentSong && currentSong.duration) || duration, 
    loading, 
    error, 
    playPause, 
    seek, 
    fastForward, 
    rewind, 
    stop, 
    isPlaying, 
    analyser: analyserRef.current 
  };
}