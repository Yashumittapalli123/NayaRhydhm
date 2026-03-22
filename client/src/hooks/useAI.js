import { useState } from 'react';

const MOCK_VIBES = {
  "chill": ["Lofi Girl - Study Session", "Nujabes - Feather", "Bonobo - Cirrus", "Tycho - Awake", "J Dilla - Don't Cry"],
  "party": ["Daft Punk - One More Time", "Dua Lipa - Levitating", "The Weeknd - Blinding Lights", "Pharrell Williams - Happy", "Bruno Mars - 24K Magic"],
  "neon": ["The Midnight - Sunset", "Perturbator - Future Club", "Kavinsky - Nightcall", "Home - Resonance", "Carpenter Brut - Turbo Killer"],
  "calm": ["Enya - Only Time", "Brian Eno - An Ending (Ascent)", "Aphex Twin - #3", "Hans Zimmer - Interstellar Main Theme", "Max Richter - On the Nature of Daylight"]
};

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVibe = async (prompt) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/vibe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "AI Vibe currently unavailable. Please try again later.");
      }

      const data = await response.json();
      return data.suggestions || [];

    } catch (err) {
      console.error('[AI Hook Error]', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { fetchVibe, loading, error };
}
