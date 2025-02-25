import React, { useState, useEffect, useRef } from "react";

// Define types for the application
type VisualizerType = "bars" | "circular" | "wave";
type ThemeName = "neon" | "monochrome" | "ocean";

interface ThemeStyle {
  background: string;
  color: string;
  borderColor: string;
  boxShadow: string;
}

const AudioVisualizer: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioData, setAudioData] = useState<Uint8Array>(
    new Uint8Array(128).fill(0)
  );
  const [visualizerType, setVisualizerType] = useState<VisualizerType>("bars");
  const [theme, setTheme] = useState<ThemeName>("neon");

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize audio context
  useEffect(() => {
    return () => {
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Toggle recording
  const toggleRecording = async (): Promise<void> => {
    if (isRecording) {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setIsRecording(false);
      setAudioData(new Uint8Array(128).fill(0));
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        if (!audioContextRef.current) {
          audioContextRef.current = new window.AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
        }

        sourceRef.current =
          audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current!);

        setIsRecording(true);
        visualize();
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    }
  };

  // Animation loop for visualization
  const visualize = (): void => {
    if (!analyserRef.current || !canvasRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const draw = (): void => {
      animationRef.current = requestAnimationFrame(draw);

      analyserRef.current!.getByteFrequencyData(dataArray);
      setAudioData(new Uint8Array(dataArray));

      ctx.clearRect(0, 0, width, height);

      // Select visualizer type
      switch (visualizerType) {
        case "bars":
          drawBars(ctx, dataArray, width, height);
          break;
        case "circular":
          drawCircular(ctx, dataArray, width, height);
          break;
        case "wave":
          drawWave(ctx, dataArray, width, height);
          break;
        default:
          drawBars(ctx, dataArray, width, height);
      }
    };

    draw();
  };

  // Drawing functions for different visualizers
  const drawBars = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ): void => {
    const bufferLength = dataArray.length;
    const barWidth = (width / bufferLength) * 2.5;

    let x = 0;

    const getBarColor = (i: number, value: number): string => {
      if (theme === "neon") {
        return `hsl(${(i / bufferLength) * 360}, 100%, ${50 + value / 5}%)`;
      } else if (theme === "monochrome") {
        return `rgb(${value}, ${value}, ${value})`;
      } else {
        // Ocean theme
        return `rgb(0, ${100 + value / 2}, ${155 + value / 4})`;
      }
    };

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;

      ctx.fillStyle = getBarColor(i, dataArray[i]);
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

      x += barWidth;
    }
  };

  const drawCircular = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ): void => {
    const bufferLength = dataArray.length;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius / 2, 0, 2 * Math.PI);
    ctx.fillStyle =
      theme === "neon" ? "#111" : theme === "monochrome" ? "#222" : "#103050";
    ctx.fill();

    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i] / 255;
      const angle = (i * 2 * Math.PI) / bufferLength;

      const innerRadius = radius;
      const outerRadius = radius + value * radius * 1.5;

      const x1 = centerX + innerRadius * Math.cos(angle);
      const y1 = centerY + innerRadius * Math.sin(angle);
      const x2 = centerX + outerRadius * Math.cos(angle);
      const y2 = centerY + outerRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 2;

      if (theme === "neon") {
        ctx.strokeStyle = `hsl(${(i / bufferLength) * 360}, 100%, ${
          50 + value * 50
        }%)`;
      } else if (theme === "monochrome") {
        const intensity = 100 + value * 155;
        ctx.strokeStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
      } else {
        // Ocean theme
        ctx.strokeStyle = `rgb(${value * 50}, ${100 + value * 155}, ${
          200 + value * 55
        })`;
      }

      ctx.stroke();
    }
  };

  const drawWave = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ): void => {
    const bufferLength = dataArray.length;
    const sliceWidth = width / bufferLength;
    let x = 0;

    ctx.beginPath();

    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i] / 255;
      const y = ((1 - value) * height) / 2 + Math.sin(x / 50) * 5 * value;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    // Mirror the wave
    for (let i = bufferLength - 1; i >= 0; i--) {
      const value = dataArray[i] / 255;
      const y =
        height - (((1 - value) * height) / 2 + Math.sin(x / 50) * 5 * value);
      ctx.lineTo(x, y);
      x -= sliceWidth;
    }

    ctx.closePath();

    let gradient: CanvasGradient;
    if (theme === "neon") {
      gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(255, 0, 255, 0.7)");
      gradient.addColorStop(0.5, "rgba(0, 255, 255, 0.7)");
      gradient.addColorStop(1, "rgba(255, 0, 255, 0.7)");
    } else if (theme === "monochrome") {
      gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
      gradient.addColorStop(1, "rgba(50, 50, 50, 0.7)");
    } else {
      // Ocean theme
      gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(0, 200, 255, 0.7)");
      gradient.addColorStop(1, "rgba(0, 50, 100, 0.7)");
    }

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle =
      theme === "neon" ? "#fff" : theme === "monochrome" ? "#ddd" : "#0ff";
    ctx.stroke();
  };

  // Theme selection styles
  const getThemeStyle = (themeName: ThemeName): ThemeStyle => {
    switch (themeName) {
      case "neon":
        return {
          background: "linear-gradient(135deg, #000, #111)",
          color: "#0ff",
          borderColor: "#f0f",
          boxShadow: "0 0 10px #f0f, 0 0 20px #0ff",
        };
      case "monochrome":
        return {
          background: "linear-gradient(135deg, #222, #333)",
          color: "#fff",
          borderColor: "#888",
          boxShadow: "0 0 10px rgba(255,255,255,0.3)",
        };
      case "ocean":
        return {
          background: "linear-gradient(135deg, #001, #024)",
          color: "#0cf",
          borderColor: "#08f",
          boxShadow: "0 0 10px rgba(0,150,255,0.5)",
        };
      default:
        return {
          background: "",
          color: "",
          borderColor: "",
          boxShadow: "",
        };
    }
  };

  const currentThemeStyle = getThemeStyle(theme);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full p-6"
      style={{ background: currentThemeStyle.background }}
    >
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: currentThemeStyle.color }}
      >
        Audio Visualizer
      </h1>

      <div className="mb-6 flex gap-4">
        <button
          onClick={toggleRecording}
          className="px-4 py-2 rounded-full text-lg font-medium transition-all duration-300"
          style={{
            color: currentThemeStyle.color,
            border: `2px solid ${currentThemeStyle.borderColor}`,
            boxShadow: isRecording ? currentThemeStyle.boxShadow : "none",
            background: isRecording ? "rgba(255,255,255,0.1)" : "transparent",
          }}
        >
          {isRecording ? "Stop Microphone" : "Start Microphone"}
        </button>
      </div>

      <div
        className="w-full max-w-3xl rounded-lg overflow-hidden mb-6"
        style={{
          border: `2px solid ${currentThemeStyle.borderColor}`,
          boxShadow: currentThemeStyle.boxShadow,
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-64 bg-black"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <div className="flex flex-col items-center">
          <h3 className="mb-2" style={{ color: currentThemeStyle.color }}>
            Visualizer Type
          </h3>
          <div className="flex gap-2">
            {(["bars", "circular", "wave"] as VisualizerType[]).map((type) => (
              <button
                key={type}
                onClick={() => setVisualizerType(type)}
                className="px-3 py-1 rounded-md transition-all duration-200 capitalize"
                style={{
                  color: currentThemeStyle.color,
                  border: `1px solid ${currentThemeStyle.borderColor}`,
                  background:
                    visualizerType === type
                      ? "rgba(255,255,255,0.15)"
                      : "transparent",
                  boxShadow:
                    visualizerType === type
                      ? currentThemeStyle.boxShadow
                      : "none",
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h3 className="mb-2" style={{ color: currentThemeStyle.color }}>
            Theme
          </h3>
          <div className="flex gap-2">
            {(["neon", "monochrome", "ocean"] as ThemeName[]).map(
              (themeName) => (
                <button
                  key={themeName}
                  onClick={() => setTheme(themeName)}
                  className="px-3 py-1 rounded-md transition-all duration-200 capitalize"
                  style={{
                    color: getThemeStyle(themeName).color,
                    border: `1px solid ${getThemeStyle(themeName).borderColor}`,
                    background:
                      theme === themeName
                        ? "rgba(255,255,255,0.15)"
                        : "transparent",
                    boxShadow:
                      theme === themeName
                        ? getThemeStyle(themeName).boxShadow
                        : "none",
                  }}
                >
                  {themeName}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div
        className="text-sm opacity-70"
        style={{ color: currentThemeStyle.color }}
      >
        Click "Start Microphone" to begin audio visualization
      </div>
    </div>
  );
};

export default AudioVisualizer;
