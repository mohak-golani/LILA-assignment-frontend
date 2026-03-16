import React from 'react';
import type { PlayerInfo } from '../services/api';

interface PlayerSelectorProps {
  players: PlayerInfo[];
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string | null) => void;
  showBots: boolean;
  showPlayers: boolean;
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  selectedPlayerId,
  onPlayerSelect,
  showBots,
  showPlayers,
}) => {
  const filteredPlayers = players.filter(player => {
    if (player.isBot && !showBots) return false;
    if (!player.isBot && !showPlayers) return false;
    return true;
  });

  const humanPlayers = filteredPlayers.filter(p => !p.isBot);
  const botPlayers = filteredPlayers.filter(p => p.isBot);

  return (
    <div className="player-selector">
      <div className="player-selector-header">
        <h4>👥 Players ({filteredPlayers.length})</h4>
        <button
          onClick={() => onPlayerSelect(null)}
          className={`player-button ${selectedPlayerId === null ? 'selected' : ''}`}
        >
          Show All
        </button>
      </div>

      {humanPlayers.length > 0 && (
        <div className="player-group">
          <h5>🧑 Human Players ({humanPlayers.length})</h5>
          <div className="player-list">
            {humanPlayers.map((player) => (
              <button
                key={player.user_id}
                onClick={() => onPlayerSelect(
                  selectedPlayerId === player.user_id ? null : player.user_id
                )}
                className={`player-button ${
                  selectedPlayerId === player.user_id ? 'selected' : ''
                }`}
                title={`Events: ${player.eventCount} | Active: ${formatDuration(player.firstSeen, player.lastSeen)}`}
              >
                <div className="player-info">
                  <span className="player-id">
                    {player.user_id.substring(0, 8)}...
                  </span>
                  <span className="player-stats">
                    {player.eventCount} events
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {botPlayers.length > 0 && (
        <div className="player-group">
          <h5>🤖 Bots ({botPlayers.length})</h5>
          <div className="player-list">
            {botPlayers.map((player) => (
              <button
                key={player.user_id}
                onClick={() => onPlayerSelect(
                  selectedPlayerId === player.user_id ? null : player.user_id
                )}
                className={`player-button bot ${
                  selectedPlayerId === player.user_id ? 'selected' : ''
                }`}
                title={`Events: ${player.eventCount} | Active: ${formatDuration(player.firstSeen, player.lastSeen)}`}
              >
                <div className="player-info">
                  <span className="player-id">Bot {player.user_id}</span>
                  <span className="player-stats">
                    {player.eventCount} events
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const formatDuration = (firstSeen: string, lastSeen: string): string => {
  const start = new Date(firstSeen);
  const end = new Date(lastSeen);
  const diffMs = end.getTime() - start.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffMin > 0) {
    return `${diffMin}m ${diffSec % 60}s`;
  }
  return `${diffSec}s`;
};

export default PlayerSelector;