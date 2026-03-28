import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Playlist ──────────────────────────────────────────────────────────────
      playlist: [],
      currentIndex: -1,
      recentSongs: [], 
      vibeHistory: [], 
      downloadedSongs: [], 

      addSong: (song) => set(state => {
        if (!song) return state;
        const exists = state.playlist.find(s => s.id === song.id);
        if (exists) return state;
        const playlist = [...state.playlist, song];
        return {
          playlist,
          currentIndex: state.currentIndex === -1 ? 0 : state.currentIndex,
        };
      }),

      removeSong: (id) => set(state => {
        const idx = state.playlist.findIndex(s => s.id === id);
        const playlist = state.playlist.filter(s => s.id !== id);
        let currentIndex = state.currentIndex;
        if (idx < currentIndex) currentIndex--;
        else if (idx === currentIndex) currentIndex = Math.min(currentIndex, playlist.length - 1);
        return { playlist, currentIndex: playlist.length === 0 ? -1 : currentIndex };
      }),

      clearPlaylist: () => set({ playlist: [], currentIndex: -1 }),

      addToRecent: (song) => set(state => {
        if (!song) return state;
        const filtered = state.recentSongs.filter(s => s.id !== song.id);
        return { recentSongs: [song, ...filtered].slice(0, 20) };
      }),

      removeRecentSong: (id) => set(state => ({
        recentSongs: state.recentSongs.filter(s => s.id !== id)
      })),

      setCurrentIndex: (i) => set({ currentIndex: i }),

      currentSong: () => {
        const { playlist, currentIndex } = get();
        return currentIndex >= 0 ? playlist[currentIndex] : null;
      },

      nextSong: () => {
        const { playlist, currentIndex, shuffle, loop } = get();
        if (!playlist.length) return null;
        let next;
        if (shuffle) {
          next = Math.floor(Math.random() * playlist.length);
        } else {
          next = currentIndex + 1;
          if (next >= playlist.length) next = loop ? 0 : -1;
        }
        if (next === -1) return null;
        set({ currentIndex: next });
        return playlist[next];
      },

      prevSong: () => {
        const { playlist, currentIndex, loop } = get();
        if (!playlist.length) return null;
        let prev = currentIndex - 1;
        if (prev < 0) prev = loop ? playlist.length - 1 : 0;
        set({ currentIndex: prev });
        return playlist[prev];
      },
      addVibeToHistory: (prompt, songs) => set(state => ({
        vibeHistory: [{ id: Date.now(), prompt, songs, date: new Date().toISOString() }, ...state.vibeHistory].slice(0, 20)
      })),
      removeVibeFromHistory: (id) => set(state => ({
        vibeHistory: state.vibeHistory.filter(v => v.id !== id)
      })),
      addDownloadedSong: (song) => set(state => ({
        downloadedSongs: [...state.downloadedSongs.filter(s => s.id !== song.id), song]
      })),
      removeDownloadedSong: (id) => set(state => ({
        downloadedSongs: state.downloadedSongs.filter(s => s.id !== id)
      })),

      // ── Player state ──────────────────────────────────────────────────────────
      isPlaying: false,
      volume: 0.8,
      shuffle: false,
      loop: false,

      setIsPlaying: (v) => set({ isPlaying: v }),
      setVolume: (v) => set({ volume: v }),
      toggleShuffle: () => set(s => ({ shuffle: !s.shuffle })),
      toggleLoop: () => set(s => ({ loop: !s.loop })),

      // ── Lyrics State & Logic ───────────────────────────────────────────────
      lyrics: null,
      syncedLyrics: null, // Array of { time: number, text: string }
      lyricsLoading: false,
      setLyrics: (l) => set({ lyrics: l }),

      fetchLyrics: async (title) => {
        if (!title) return;
        if (get().lyricsLoading) return;
        set({ lyricsLoading: true, lyrics: null, syncedLyrics: null });
        
        // Clean title for better search
        const clean = title
          .replace(/\(Official.*?\)/gi, '')
          .replace(/\[Official.*?\]/gi, '')
          .replace(/\(Audio.*?\)/gi, '')
          .replace(/\(Lyric.*?\)/gi, '')
          .replace(/Video/gi, '')
          .replace(/Music/gi, '')
          .trim();

        const parts = clean.split(/[-|:]/).map(s => s.trim());
        const artist = parts[0] || '';
        const track = parts[1] || parts[0];

        try {
          // 1. Try robust search first via LRCLIB (faster/more accurate for synced)
          const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(clean)}`;
          const searchRes = await fetch(searchUrl);
          if (searchRes.ok) {
            const results = await searchRes.json();
            // Find first result with synced lyrics
            const best = results.find(r => r.syncedLyrics) || results[0];
            if (best && best.syncedLyrics) {
              const parsed = get().parseLRC(best.syncedLyrics);
              if (parsed.length > 0) {
                set({ syncedLyrics: parsed, lyrics: best.plainLyrics || null, lyricsLoading: false });
                return;
              }
            }
          }

          // 2. Fallback to direct get (sometimes search misses)
          const getUrl = `https://lrclib.net/api/get?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`;
          const getRes = await fetch(getUrl);
          if (getRes.ok) {
            const data = await getRes.json();
            if (data.syncedLyrics) {
              const parsed = get().parseLRC(data.syncedLyrics);
              if (parsed.length > 0) {
                set({ syncedLyrics: parsed, lyrics: data.plainLyrics || null, lyricsLoading: false });
                return;
              }
            }
          }

          // 3. Fallback to lyrics.ovh for plain text only
          const ovhRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`);
          const ovhData = await ovhRes.json();
          if (ovhData.lyrics) {
            set({ lyrics: ovhData.lyrics, lyricsLoading: false });
          } else {
            set({ lyrics: 'Lyrics not available', lyricsLoading: false });
          }
        } catch (e) {
          console.warn('[Store] Lyrics error:', e);
          set({ lyrics: 'Lyrics not available', lyricsLoading: false });
        }
      },

      parseLRC: (lrc) => {
        if (!lrc) return [];
        const lines = lrc.split('\n');
        const result = [];
        // Support multiple timestamps per line [mm:ss.xx][mm:ss.yy] text
        const timeRegex = /\[(\d+):(\d+(\.\d+)?)\]/g;

        lines.forEach(line => {
          const times = [];
          let match;
          while ((match = timeRegex.exec(line)) !== null) {
            const minutes = parseInt(match[1]);
            const seconds = parseFloat(match[2]);
            times.push(minutes * 60 + seconds);
          }
          const text = line.replace(/\[.*?\]/g, '').trim();
          if (text) {
            times.forEach(t => result.push({ time: t, text }));
          }
        });
        return result.sort((a, b) => a.time - b.time);
      }
    }),
    {
      name: 'maya-rhydhm-storage-v4',
      partialize: (state) => ({
        playlist: state.playlist,
        currentIndex: state.currentIndex,
        recentSongs: state.recentSongs,
        vibeHistory: state.vibeHistory,
        volume: state.volume,
        shuffle: state.shuffle,
        loop: state.loop,
        downloadedSongs: state.downloadedSongs,
      }),
    }
  )
);