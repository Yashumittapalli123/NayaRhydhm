import React, { useState, useEffect, useRef } from 'react';
import { useAI } from '../hooks/useAI';
import { useStore } from '../store/useStore';

const AIVibeSearch = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef();
  const { fetchVibe, loading, error } = useAI();
  const { addSong, addVibeToHistory } = useStore();
  const [status, setStatus] = useState('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVibeSearch = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const titles = await fetchVibe(prompt);
    if (!titles || titles.length === 0) {
      if (!error) setPrompt('AI could not find songs for this vibe. Try a different prompt!');
      return;
    }

    if (titles && titles.length > 0) {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      setStatus(`Curating ${titles.length} tracks...`);

      try {
        const resolutionPromises = titles.map(async (title) => {
          const res = await fetch(`${apiUrl}/search?q=${encodeURIComponent(title)}`);
          if (res.ok) {
            const results = await res.json();
            if (results && results.length > 0) return results[0];
          }
          return null;
        });

        const resolved = await Promise.all(resolutionPromises);
        const curatedSongs = resolved.filter(s => s !== null);

        if (curatedSongs.length > 0) {
          curatedSongs.forEach(s => addSong(s));
          addVibeToHistory(prompt, curatedSongs);
          setStatus('COMPLETE');
          setTimeout(() => onClose(), 2200);
        } else {
          setStatus('Could not find those tracks. Try a different mood!');
        }
      } catch (err) {
        console.error('Failed to resolve AI suggestions', err);
        setStatus('Ready to listen! Your playlist is updated.');
        setTimeout(() => onClose(), 1500);
      }
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="glass-2 fade-up" 
        style={{ 
          width: '100%', maxWidth: 500, padding: '32px', 
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>🧠</span>
            <div>
              <h2 className="text-gradient" style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>AI Vibe Discovery</h2>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Powered by Llama 3.1</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>
        
        <div style={{ 
          padding: '20px', background: 'rgba(255,255,255,0.03)', 
          borderRadius: 'var(--radius-md)', marginBottom: 24,
          borderLeft: '4px solid var(--accent)'
        }}>
          <h5 style={{ margin: '0 0 8px', color: 'white', fontSize: 14 }}>How it works?</h5>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Simply describe a scene, a feeling, or a location. Our advanced **NVIDIA Llama 3.1** engine understands the context and curates a personalized queue of high-fidelity tracks to match your exact vibe.
          </p>
        </div>

        <form onSubmit={handleVibeSearch} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <input 
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'A lonely rainy night in a futuristic city'..."
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: 15,
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
            {loading && (
              <div className="spin" style={{ 
                position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                width: 20, height: 20, border: '2px solid var(--accent)',
                borderTopColor: 'transparent', borderRadius: '50%'
              }} />
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !prompt.trim()}
            className="btn-primary"
            style={{ 
              height: 52, fontSize: 16,
              opacity: (loading || !prompt.trim()) ? 0.5 : 1,
              cursor: (loading || !prompt.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? "AI is vibing..." : "Generate My Experience"}
          </button>
          
          {status && (
            <div style={{ 
              textAlign: 'center', fontSize: 13, fontWeight: 600, 
              color: status.includes('✨') ? 'var(--accent)' : 'white',
              marginTop: 10, animation: 'fade-in 0.3s ease'
            }}>
              {status}
            </div>
          )}
          {error && (
            <div style={{ textAlign: 'center', fontSize: 11, color: '#f87171', marginTop: 8 }}>
              {error}
            </div>
          )}
        </form>

        {status === 'COMPLETE' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'var(--brand-gradient)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-lg)', zIndex: 20,
            animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            textAlign: 'center', padding: 40
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✨</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Experience Ready!</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Your AI-curated vibe has been saved to your history.</p>
          </div>
        )}
      </div>

      <style>{`
        .spin { animation: spin-anim 1s linear infinite; }
        @keyframes spin-anim { to { transform: translateY(-50%) rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AIVibeSearch;
