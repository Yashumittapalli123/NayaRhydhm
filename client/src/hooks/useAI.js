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
      const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;

      // If no API key, use a smart mock based on keywords
      if (!apiKey) {
        console.warn("NVIDIA API Key missing. Using Mock Mode.");
        await new Promise(r => setTimeout(r, 1500)); // Simulate latency
        const lower = prompt.toLowerCase();
        if (lower.includes("neon") || lower.includes("cyber") || lower.includes("dark")) return MOCK_VIBES.neon;
        if (lower.includes("party") || lower.includes("dance") || lower.includes("hype")) return MOCK_VIBES.party;
        if (lower.includes("calm") || lower.includes("relax") || lower.includes("sleep")) return MOCK_VIBES.calm;
        return MOCK_VIBES.chill;
      }

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "meta/llama-3.1-70b-instruct",
          messages: [
            {
              role: "system",
              content: "You are a professional music curator. The user will describe a mood or vibe. Return ONLY a list of 8 real song titles (Artist - Title) that match this vibe perfectly. Do NOT include numbers, bullets, or any other text. Only one song per line."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 512
        })
      });

      if (!response.ok) throw new Error("AI Vibe currently unavailable. Please try again later.");

      const data = await response.json();
      const text = data.choices[0].message.content;
      return text.split('\n').filter(line => line.trim().length > 3).map(line => line.replace(/^\d+\.\s*/, '').trim());

    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { fetchVibe, loading, error };
}
