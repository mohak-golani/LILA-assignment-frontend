import React, { useState, useRef, useEffect } from 'react';
import type { Match } from '../services/api';
import './LeftSidebar.css';

interface LeftSidebarProps {
  matches: Match[];
  selectedMapId: string;
  selectedDate: string;
  selectedMatchId: string;
  showHeatmap: boolean;
  heatmapType: 'kills' | 'deaths' | 'traffic';
  showBots: boolean;
  showPlayers: boolean;
  showJourneyPaths: boolean;
  onMapChange: (mapId: string) => void;
  onDateChange: (date: string) => void;
  onMatchChange: (matchId: string) => void;
  onHeatmapToggle: (show: boolean) => void;
  onHeatmapTypeChange: (type: 'kills' | 'deaths' | 'traffic') => void;
  onBotsToggle: (show: boolean) => void;
  onPlayersToggle: (show: boolean) => void;
  onJourneyPathsToggle: (show: boolean) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  matches,
  selectedMapId,
  selectedDate,
  selectedMatchId,
  showHeatmap,
  heatmapType,
  showBots,
  showPlayers,
  showJourneyPaths,
  onMapChange,
  onDateChange,
  onMatchChange,
  onHeatmapToggle,
  onHeatmapTypeChange,
  onBotsToggle,
  onPlayersToggle,
  onJourneyPathsToggle
}) => {
  const [isMatchDropdownOpen, setIsMatchDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMatchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableMaps = ['Neon District', 'Cyber City', 'Waste Lands', 'The Core'];

  // Create a mapping of friendly names to API IDs if necessary, or just use the IDs
  // Assuming the API returns IDs that match or can be mapped to these.
  const apiMaps = Array.from(new Set(matches.map(m => m.map_id)));

  // Dates for the selected map
  const matchesForMap = matches.filter(m => !selectedMapId || m.map_id === selectedMapId);
  const availableDates = Array.from(new Set(matchesForMap.map(m => m.date)));

  // Matches for the selected map and date
  const availableMatches = matchesForMap.filter(m => !selectedDate || m.date === selectedDate);

  const getMapIcon = (mapName: string) => {
    switch (mapName) {
      case 'Neon District': return '🗺️'; // Replace with proper icons later if needed
      case 'Cyber City': return '🏙️';
      case 'Waste Lands': return '☁️';
      case 'The Core': return '❄️';
      default: return '📍';
    }
  };

  return (
    <aside className="left-sidebar">
      <div className="sidebar-section">
        <h3 className="section-title">REGION SELECTION</h3>
        <div className="region-list">
          {apiMaps.map(mapId => (
            <button
              key={mapId}
              className={`region-btn ${selectedMapId === mapId ? 'active' : ''}`}
              onClick={() => onMapChange(mapId)}
            >
              <span className="region-icon">{getMapIcon(mapId)}</span>
              {mapId}
            </button>
          ))}
          {/* Fallback if no matching standard maps are returned */}
          {apiMaps.length === 0 && availableMaps.map(mapName => (
            <button
              key={mapName}
              className={`region-btn ${selectedMapId === mapName ? 'active' : ''}`}
              onClick={() => onMapChange(mapName)}
            >
              <span className="region-icon">{getMapIcon(mapName)}</span>
              {mapName}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">VISUALIZATION LAYERS</h3>
        <div className="layer-toggles">
          <label className="toggle-row">
            <span className="toggle-label"><span className="layer-icon">🔥</span> Heatmap</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => onHeatmapToggle(e.target.checked)}
              />
              <span className="slider"></span>
            </div>
          </label>

          {showHeatmap && (
            <div className="heatmap-type-selector">
              <select
                value={heatmapType}
                onChange={(e) => onHeatmapTypeChange(e.target.value as any)}
                className="heatmap-select"
              >
                <option value="kills">Kill Zones</option>
                <option value="deaths">Death Zones</option>
                <option value="traffic">High Traffic</option>
              </select>
            </div>
          )}

          <label className="toggle-row">
            <span className="toggle-label"><span className="layer-icon">🤖</span> Bots</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={showBots}
                onChange={(e) => onBotsToggle(e.target.checked)}
              />
              <span className="slider"></span>
            </div>
          </label>

          <label className="toggle-row">
            <span className="toggle-label"><span className="layer-icon">👤</span> Players</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={showPlayers}
                onChange={(e) => onPlayersToggle(e.target.checked)}
              />
              <span className="slider"></span>
            </div>
          </label>

          <label className="toggle-row">
            <span className="toggle-label"><span className="layer-icon">📈</span> Player Paths</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={showJourneyPaths}
                onChange={(e) => onJourneyPathsToggle(e.target.checked)}
              />
              <span className="slider"></span>
            </div>
          </label>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">MATCH HISTORY</h3>

        <div className="match-selection-box" style={{ marginBottom: '1rem' }}>
          <div className="match-label">Date Selection</div>
          <select
            className="heatmap-select"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            style={{ marginTop: '0.5rem' }}
          >
            <option value="">All Dates</option>
            {availableDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>

        <div className="match-selection-box" ref={dropdownRef}>
          <div className="match-label">Current Session</div>
          <div
            className="custom-dropdown-header"
            onClick={() => setIsMatchDropdownOpen(!isMatchDropdownOpen)}
          >
            <span>{selectedMatchId && availableMatches.find(m => m.match_id === selectedMatchId) ? `#${selectedMatchId.substring(0, 8).toUpperCase()}` : 'Select a match...'}</span>
            <span className={`dropdown-arrow ${isMatchDropdownOpen ? 'open' : ''}`}>▼</span>
          </div>

          {isMatchDropdownOpen && (
            <div className="custom-dropdown-list">
              {availableMatches.length === 0 && (
                <div className="custom-dropdown-item empty">No matches available</div>
              )}
              {availableMatches.map(match => (
                <div
                  key={match.match_id}
                  className={`custom-dropdown-item ${selectedMatchId === match.match_id ? 'selected' : ''}`}
                  onClick={() => {
                    onMatchChange(match.match_id);
                    setIsMatchDropdownOpen(false);
                  }}
                >
                  #{match.match_id.substring(0, 8).toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
      </div>
    </aside>
  );
};

export default LeftSidebar;
