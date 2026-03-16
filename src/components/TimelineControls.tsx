import React from 'react';
import type { Event } from '../services/api';
import './TimelineControls.css';

interface TimelineControlsProps {
  events: Event[];
  currentTimeIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTimeIndexChange: (index: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  events,
  currentTimeIndex,
  isPlaying,
  playbackSpeed,
  onTimeIndexChange,
  onPlayPause,
  onSpeedChange,
  onReset,
}) => {
  const getCurrentProgress = () => {
    if (events.length === 0) return 0;
    return (currentTimeIndex / (events.length - 1)) * 100;
  };

  return (
    <div className="timeline-controls">
      <div className="timeline-info">
        <div className="event-counter">
          Event {currentTimeIndex + 1} of {events.length}
        </div>
      </div>

      <div className="timeline-slider">
        <input
          type="range"
          min={0}
          max={Math.max(0, events.length - 1)}
          value={currentTimeIndex}
          onChange={(e) => onTimeIndexChange(parseInt(e.target.value))}
          className="timeline-range"
          style={{ width: '100%' }}
        />
        <div
          className="timeline-progress"
          style={{ width: `${getCurrentProgress()}%` }}
        />
      </div>

      <div className="playback-controls">
        <button
          onClick={onReset}
          className="control-btn reset-btn"
          disabled={events.length === 0}
        >
          ⏮️ Reset
        </button>

        <button
          onClick={onPlayPause}
          className="control-btn play-pause-btn"
          disabled={events.length === 0}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>

        <div className="speed-control">
          <label>Speed: {playbackSpeed}x</label>
          <select
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="speed-select"
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
            <option value={8}>8x</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TimelineControls;