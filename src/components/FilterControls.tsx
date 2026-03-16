import React from 'react';
import type { Match } from '../services/api';
import './FilterControls.css';

interface FilterControlsProps {
  matches: Match[];
  selectedMapId: string;
  selectedDate: string;
  selectedMatchId: string;
  showHeatmap: boolean;
  heatmapType: 'kills' | 'deaths' | 'traffic';
  showBots: boolean;
  showPlayers: boolean;
  onMapChange: (mapId: string) => void;
  onDateChange: (date: string) => void;
  onMatchChange: (matchId: string) => void;
  onHeatmapToggle: (show: boolean) => void;
  onHeatmapTypeChange: (type: 'kills' | 'deaths' | 'traffic') => void;
  onBotsToggle: (show: boolean) => void;
  onPlayersToggle: (show: boolean) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  matches,
  selectedMapId,
  selectedDate,
  selectedMatchId,
  showHeatmap,
  heatmapType,
  showBots,
  showPlayers,
  onMapChange,
  onDateChange,
  onMatchChange,
  onHeatmapToggle,
  onHeatmapTypeChange,
  onBotsToggle,
  onPlayersToggle,
}) => {
  // Extract unique values for filter options
  const availableMaps = Array.from(new Set(matches.map(m => m.map_id)));
  const availableDates = Array.from(new Set(matches.map(m => m.date))).sort();
  const availableMatches = matches.filter(m => 
    (!selectedMapId || m.map_id === selectedMapId) &&
    (!selectedDate || m.date === selectedDate)
  );

  return (
    <div className="filter-controls">
      <h2>🎮 LILA BLACK Player Behavior Visualization</h2>
      
      <div className="filter-section">
        <h3>📋 Filters</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="map-select">Map:</label>
            <select
              id="map-select"
              value={selectedMapId}
              onChange={(e) => onMapChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Maps</option>
              {availableMaps.map(mapId => (
                <option key={mapId} value={mapId}>{mapId}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="date-select">Date:</label>
            <select
              id="date-select"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Dates</option>
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="match-select">Match:</label>
            <select
              id="match-select"
              value={selectedMatchId}
              onChange={(e) => onMatchChange(e.target.value)}
              className="filter-select"
            >
              <option value="">Select a match...</option>
              {availableMatches.map(match => (
                <option key={match.match_id} value={match.match_id}>
                  {match.match_id.substring(0, 8)}... ({match.players}P + {match.bots}B)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h3>🗺️ Display Options</h3>
        <div className="display-options">
          <div className="option-group">
            <h4>Players & Bots</h4>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showPlayers}
                onChange={(e) => onPlayersToggle(e.target.checked)}
              />
              Show Human Players
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showBots}
                onChange={(e) => onBotsToggle(e.target.checked)}
              />
              Show Bots
            </label>
          </div>

          <div className="option-group">
            <h4>Heatmap</h4>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => onHeatmapToggle(e.target.checked)}
              />
              Show Heatmap
            </label>
            
            {showHeatmap && (
              <div className="heatmap-types">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="heatmap-type"
                    value="kills"
                    checked={heatmapType === 'kills'}
                    onChange={(e) => onHeatmapTypeChange(e.target.value as 'kills')}
                  />
                  Kill Zones
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="heatmap-type"
                    value="deaths"
                    checked={heatmapType === 'deaths'}
                    onChange={(e) => onHeatmapTypeChange(e.target.value as 'deaths')}
                  />
                  Death Zones
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="heatmap-type"
                    value="traffic"
                    checked={heatmapType === 'traffic'}
                    onChange={(e) => onHeatmapTypeChange(e.target.value as 'traffic')}
                  />
                  High Traffic Areas
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Available Matches:</span>
            <span className="stat-value">{availableMatches.length}</span>
          </div>
          {selectedMatchId && (
            <>
              <div className="stat-item">
                <span className="stat-label">Players:</span>
                <span className="stat-value">
                  {availableMatches.find(m => m.match_id === selectedMatchId)?.players || 0}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Bots:</span>
                <span className="stat-value">
                  {availableMatches.find(m => m.match_id === selectedMatchId)?.bots || 0}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Events:</span>
                <span className="stat-value">
                  {availableMatches.find(m => m.match_id === selectedMatchId)?.totalEvents || 0}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterControls;