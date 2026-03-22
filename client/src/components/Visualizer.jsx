import { useRef, useEffect } from 'react';

export default function Visualizer({ analyser, isPlaying }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Create a glowy gradient for the bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, 'rgba(108, 99, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(167, 139, 250, 0.8)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    if (isPlaying) {
      draw();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => cancelAnimationFrame(animationId);
  }, [analyser, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={150}
      style={{
        width: '100%',
        height: '100px',
        opacity: 0.6,
        pointerEvents: 'none',
        maskImage: 'linear-gradient(to top, black, transparent)',
      }}
    />
  );
}
