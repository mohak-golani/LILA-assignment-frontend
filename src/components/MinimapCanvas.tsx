import React, { useRef, useEffect, useState } from 'react';
import type { Event, HeatmapPoint, PlayerJourney } from '../services/api';

interface MinimapCanvasProps {
  mapId: string;
  events?: Event[];
  journeys?: PlayerJourney[];
  heatmapData?: HeatmapPoint[];
  showHeatmap: boolean;
  heatmapType: 'kills' | 'deaths' | 'traffic';
  currentTimeIndex: number;
  showBots: boolean;
  showPlayers: boolean;
  showJourneyPaths?: boolean;
  selectedPlayerId?: string | null;
}

const MinimapCanvas: React.FC<MinimapCanvasProps> = ({
  mapId,
  events = [],
  journeys = [],
  heatmapData = [],
  showHeatmap,
  heatmapType,
  currentTimeIndex,
  showBots,
  showPlayers,
  showJourneyPaths = true,
  selectedPlayerId = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);

  // Load map image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setMapImage(img);
    img.onerror = () => console.error(`Failed to load minimap for ${mapId}`);
    
    // Try different image extensions
    const imageExtensions = ['png', 'jpg'];
    const tryLoadImage = (index: number) => {
      if (index >= imageExtensions.length) {
        console.error(`No minimap image found for ${mapId}`);
        return;
      }
      
      img.src = `/minimaps/${mapId}_Minimap.${imageExtensions[index]}`;
      img.onerror = () => tryLoadImage(index + 1);
    };
    
    tryLoadImage(0);
  }, [mapId]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw map background
    ctx.drawImage(mapImage, 0, 0, 1024, 1024);

    // Draw heatmap if enabled
    if (showHeatmap && heatmapData.length > 0) {
      drawHeatmap(ctx, heatmapData, heatmapType);
    }

    // Use journeys if provided, otherwise fall back to events
    if (journeys.length > 0) {
      drawJourneys(ctx, journeys, currentTimeIndex, showBots, showPlayers, showJourneyPaths, selectedPlayerId);
    } else if (events.length > 0) {
      // Draw events up to current time (legacy mode)
      const currentEvents = events.slice(0, currentTimeIndex + 1);
      drawEvents(ctx, currentEvents, showBots, showPlayers);
    }

  }, [mapImage, events, journeys, heatmapData, showHeatmap, heatmapType, currentTimeIndex, showBots, showPlayers, showJourneyPaths, selectedPlayerId]);

  const drawHeatmap = (
    ctx: CanvasRenderingContext2D,
    points: HeatmapPoint[],
    type: 'kills' | 'deaths' | 'traffic'
  ) => {
    const colors = {
      kills: 'rgba(255, 0, 0, 0.6)',     // Red for kills
      deaths: 'rgba(255, 255, 0, 0.6)',  // Yellow for deaths  
      traffic: 'rgba(0, 0, 255, 0.6)'    // Blue for traffic
    };

    const radius = type === 'traffic' ? 3 : 8;
    
    ctx.save();
    ctx.fillStyle = colors[type];

    points.forEach(point => {
      // Ensure coordinates are within canvas bounds
      const x = Math.max(0, Math.min(1024, point.pixelX));
      const y = Math.max(0, Math.min(1024, point.pixelY));
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.restore();
  };

  const drawJourneys = (
    ctx: CanvasRenderingContext2D,
    journeys: PlayerJourney[],
    currentTimeIndex: number,
    showBots: boolean,
    showPlayers: boolean,
    showPaths: boolean,
    selectedPlayerId: string | null
  ) => {
    // Generate unique colors for each player
    const playerColors = generatePlayerColors(journeys);

    journeys.forEach(journey => {
      // Filter by bot/player visibility
      if (journey.isBot && !showBots) return;
      if (!journey.isBot && !showPlayers) return;

      const isSelected = selectedPlayerId === journey.user_id;
      const baseColor = playerColors[journey.user_id];
      
      // Draw path if enabled
      if (showPaths && journey.path.length > 1) {
        drawPlayerPath(ctx, journey.path, baseColor, isSelected, currentTimeIndex);
      }

      // Draw action events (kills, deaths, loot, etc.)
      journey.actions.forEach(event => {
        const eventTime = getEventTimeIndex(event, [...journey.path, ...journey.actions]);
        if (eventTime > currentTimeIndex) return;

        drawActionEvent(ctx, event, baseColor, isSelected);
      });

      // Draw current position
      if (journey.path.length > 0) {
        const currentPositionIndex = Math.min(currentTimeIndex, journey.path.length - 1);
        if (currentPositionIndex >= 0) {
          drawCurrentPosition(ctx, journey.path[currentPositionIndex], baseColor, isSelected, journey.isBot);
        }
      }
    });
  };

  const generatePlayerColors = (journeys: PlayerJourney[]): Record<string, string> => {
    const colors: Record<string, string> = {};
    const playerColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C8FF', '#FFD93D'
    ];
    const botColors = [
      '#FF9999', '#99FFE6', '#99CCFF', '#B3E5B3', '#FFEB99',
      '#E6B3E6', '#B3F0E6', '#FFF199', '#D4B3E6', '#B3D9FF'
    ];

    let playerIndex = 0;
    let botIndex = 0;

    journeys.forEach(journey => {
      if (journey.isBot) {
        colors[journey.user_id] = botColors[botIndex % botColors.length];
        botIndex++;
      } else {
        colors[journey.user_id] = playerColors[playerIndex % playerColors.length];
        playerIndex++;
      }
    });

    return colors;
  };

  const drawPlayerPath = (
    ctx: CanvasRenderingContext2D,
    path: Event[],
    baseColor: string,
    isSelected: boolean,
    currentTimeIndex: number
  ) => {
    if (path.length < 2) return;

    ctx.save();
    ctx.strokeStyle = isSelected ? baseColor : `${baseColor}80`; // Add transparency for non-selected
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw path up to current time
    const visiblePathLength = Math.min(currentTimeIndex, path.length - 1);
    
    if (visiblePathLength > 0) {
      ctx.beginPath();
      let firstPoint = true;

      for (let i = 0; i <= visiblePathLength; i++) {
        const event = path[i];
        const x = Math.max(0, Math.min(1024, event.pixelX));
        const y = Math.max(0, Math.min(1024, event.pixelY));

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawActionEvent = (
    ctx: CanvasRenderingContext2D,
    event: Event,
    baseColor: string,
    isSelected: boolean
  ) => {
    const x = Math.max(0, Math.min(1024, event.pixelX));
    const y = Math.max(0, Math.min(1024, event.pixelY));
    const size = isSelected ? 6 : 4;

    ctx.save();
    
    // Set colors based on event type
    const eventStyles = {
      Kill: { color: '#FF0000', shape: 'cross' },
      BotKill: { color: '#FF4444', shape: 'cross' },
      Killed: { color: '#FFFF00', shape: 'cross' },
      BotKilled: { color: '#FFFF44', shape: 'cross' },
      KilledByStorm: { color: '#800080', shape: 'cross' },
      Loot: { color: '#00FFFF', shape: 'diamond' }
    };

    const style = eventStyles[event.event as keyof typeof eventStyles] || { color: baseColor, shape: 'circle' };
    ctx.fillStyle = style.color;
    ctx.strokeStyle = style.color;
    ctx.lineWidth = 2;

    // Draw different shapes for different event types
    if (style.shape === 'cross') {
      ctx.beginPath();
      ctx.moveTo(x - size, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.moveTo(x + size, y - size);
      ctx.lineTo(x - size, y + size);
      ctx.stroke();
    } else if (style.shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();
  };

  const drawCurrentPosition = (
    ctx: CanvasRenderingContext2D,
    event: Event,
    baseColor: string,
    isSelected: boolean,
    isBot: boolean
  ) => {
    const x = Math.max(0, Math.min(1024, event.pixelX));
    const y = Math.max(0, Math.min(1024, event.pixelY));
    const radius = isSelected ? 8 : 6;

    ctx.save();
    
    // Outer ring
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Inner dot
    ctx.fillStyle = isBot ? '#FFFFFF' : '#000000';
    ctx.beginPath();
    ctx.arc(x, y, radius - 2, 0, 2 * Math.PI);
    ctx.fill();

    // Selection indicator
    if (isSelected) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  };

  const getEventTimeIndex = (event: Event, allEvents: Event[]): number => {
    const eventTime = new Date(event.timestamp).getTime();
    return allEvents.findIndex(e => new Date(e.timestamp).getTime() >= eventTime);
  };

  const drawEvents = (
    ctx: CanvasRenderingContext2D,
    currentEvents: Event[],
    showBots: boolean,
    showPlayers: boolean
  ) => {
    const eventColors = {
      Position: { player: 'rgba(0, 255, 0, 0.7)', bot: 'rgba(100, 255, 100, 0.5)' },
      BotPosition: { player: 'rgba(0, 255, 0, 0.7)', bot: 'rgba(100, 255, 100, 0.5)' },
      Kill: { player: 'rgba(255, 0, 0, 0.9)', bot: 'rgba(255, 100, 100, 0.7)' },
      BotKill: { player: 'rgba(255, 0, 0, 0.9)', bot: 'rgba(255, 100, 100, 0.7)' },
      Killed: { player: 'rgba(255, 255, 0, 0.9)', bot: 'rgba(255, 255, 100, 0.7)' },
      BotKilled: { player: 'rgba(255, 255, 0, 0.9)', bot: 'rgba(255, 255, 100, 0.7)' },
      KilledByStorm: { player: 'rgba(128, 0, 128, 0.9)', bot: 'rgba(178, 100, 178, 0.7)' },
      Loot: { player: 'rgba(0, 255, 255, 0.8)', bot: 'rgba(100, 255, 255, 0.6)' },
    };

    currentEvents.forEach(event => {
      // Filter by bot/player visibility
      if (event.isBot && !showBots) return;
      if (!event.isBot && !showPlayers) return;

      // Ensure coordinates are within bounds
      const x = Math.max(0, Math.min(1024, event.pixelX));
      const y = Math.max(0, Math.min(1024, event.pixelY));

      const colorType = event.isBot ? 'bot' : 'player';
      const color = eventColors[event.event as keyof typeof eventColors]?.[colorType] || 'rgba(255, 255, 255, 0.7)';
      
      ctx.save();
      ctx.fillStyle = color;

      // Different shapes for different event types
      if (event.event.includes('Position')) {
        // Small circles for position tracking
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      } else if (event.event.includes('Kill')) {
        // X marks for kills
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 4);
        ctx.lineTo(x + 4, y + 4);
        ctx.moveTo(x + 4, y - 4);
        ctx.lineTo(x - 4, y + 4);
        ctx.stroke();
      } else if (event.event === 'Loot') {
        // Diamonds for loot
        ctx.beginPath();
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x + 4, y);
        ctx.lineTo(x, y + 4);
        ctx.lineTo(x - 4, y);
        ctx.closePath();
        ctx.fill();
      } else {
        // Default circle
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.restore();
    });
  };

  return (
    <div className="minimap-container">
      <canvas
        ref={canvasRef}
        width={1024}
        height={1024}
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: '800px',
          border: '2px solid #333',
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

export default MinimapCanvas;