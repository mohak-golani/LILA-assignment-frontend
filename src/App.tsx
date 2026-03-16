import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMatches, useMatchEvents, useHeatmapData, useAllPlayerJourneys, useMatchPlayers } from './hooks/useApi';
import TopNav from './components/TopNav';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import MinimapCanvas from './components/MinimapCanvas';
import TimelineControls from './components/TimelineControls';
import PlayerSelector from './components/PlayerSelector';
import type { Match } from './services/api';
import './App_new.css';

const queryClient = new QueryClient();

function AppContent() {
  // Filter states
  const [selectedMapId, setSelectedMapId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');

  // Display states
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapType, setHeatmapType] = useState<'kills' | 'deaths' | 'traffic'>('kills');
  const [showBots, setShowBots] = useState(true);
  const [showPlayers, setShowPlayers] = useState(true);
  const [showJourneyPaths, setShowJourneyPaths] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Timeline states
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Data queries
  // Fetch all matches so LeftSidebar can correctly display all available maps and dates
  const { data: matchesData, isLoading: matchesLoading } = useMatches();

  // Use journey-based data loading instead of event-based
  const { data: journeysData, isLoading: journeysLoading } = useAllPlayerJourneys(
    selectedMatchId || null,
    showBots,
    showPlayers,
    !!selectedMatchId
  );

  const { data: playersData } = useMatchPlayers(
    selectedMatchId || null,
    !!selectedMatchId
  );

  // Fallback to events for backward compatibility
  const { data: eventsData } = useMatchEvents(
    selectedMatchId || null,
    1,
    50000,
    !!selectedMatchId && !journeysData
  );

  const currentMapId = journeysData?.journeys[0]?.path[0]?.map_id ||
    eventsData?.events[0]?.map_id ||
    selectedMapId;

  const { data: heatmapData } = useHeatmapData(
    currentMapId || null,
    heatmapType,
    showHeatmap && !!currentMapId
  );

  // Calculate total timeline length from true global events count
  // Since journeys separate out "actions" and "path" and bots vs humans, they aren't safe for calculating true global timestep length.
  // We use `eventsData` as the single source of truth for the absolute timeline length of the match
  const timelineLength = eventsData?.events.length || 0;

  // Timeline playback effect
  useEffect(() => {
    if (!isPlaying || timelineLength === 0) return;

    const interval = setInterval(() => {
      setCurrentTimeIndex(prev => {
        if (prev >= timelineLength - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, Math.max(50, 1000 / playbackSpeed));

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, timelineLength]);

  // Reset timeline when match changes
  useEffect(() => {
    setCurrentTimeIndex(0);
    setIsPlaying(false);
    setSelectedPlayerId(null);
  }, [selectedMatchId]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTimeIndex(0);
    setIsPlaying(false);
  };

  const handleMapChange = (mapId: string) => {
    setSelectedMapId(mapId);
    setSelectedDate('');
  };

  const handleMatchChange = (matchId: string) => {
    setSelectedMatchId(matchId);
    // Auto-select map and date based on selected match
    const match = matchesData?.matches.find((m: Match) => m.match_id === matchId);
    if (match) {
      setSelectedMapId(match.map_id);
      setSelectedDate(match.date);
    }
  };

  if (matchesLoading) {
    return (
      <div className="app loading">
        <div className="loading-message">
          <h2>🎮 Loading Data...</h2>
          <p>Fetching matches from backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <TopNav />

      <LeftSidebar
        matches={matchesData?.matches || []}
        selectedMapId={selectedMapId}
        selectedDate={selectedDate}
        selectedMatchId={selectedMatchId}
        showHeatmap={showHeatmap}
        heatmapType={heatmapType}
        showBots={showBots}
        showPlayers={showPlayers}
        showJourneyPaths={showJourneyPaths}
        onMapChange={handleMapChange}
        onDateChange={setSelectedDate}
        onMatchChange={handleMatchChange}
        onHeatmapToggle={setShowHeatmap}
        onHeatmapTypeChange={setHeatmapType}
        onBotsToggle={setShowBots}
        onPlayersToggle={setShowPlayers}
        onJourneyPathsToggle={setShowJourneyPaths}
      />

      <main className="main-content-area">
        {selectedMatchId && currentMapId ? (
          <div className="visualization-container">
            <div className="main-content">
              <div className="minimap-section">
                <div className="minimap-header">
                  <div className="minimap-title-group">
                    <h2>{currentMapId}</h2>
                    <span className="instance-id">INSTANCE {selectedMatchId.substring(0, 10).toUpperCase()}</span>
                  </div>
                  <div className="header-stats">
                    <div className="header-stat">
                      <span className="stat-label">TOTAL EVENTS</span>
                      <span className="stat-value">{(matchesData?.matches.find((m: Match) => m.match_id === selectedMatchId)?.totalEvents || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {journeysLoading ? (
                  <div className="loading-message">
                    <p>Loading player journeys...</p>
                  </div>
                ) : (
                  <div className="map-wrapper">
                    <MinimapCanvas
                      mapId={currentMapId}
                      events={eventsData?.events}
                      journeys={journeysData?.journeys}
                      heatmapData={heatmapData?.data}
                      showHeatmap={showHeatmap}
                      heatmapType={heatmapType}
                      currentTimeIndex={currentTimeIndex}
                      showBots={showBots}
                      showPlayers={showPlayers}
                      showJourneyPaths={showJourneyPaths}
                      selectedPlayerId={selectedPlayerId}
                    />
                  </div>
                )}
              </div>

              {playersData && (
                <div className="player-section" style={{ display: 'none' }}>
                  <PlayerSelector
                    players={playersData.players}
                    selectedPlayerId={selectedPlayerId}
                    onPlayerSelect={setSelectedPlayerId}
                    showBots={showBots}
                    showPlayers={showPlayers}
                  />
                </div>
              )}
            </div>

            {(journeysData?.journeys || eventsData?.events) && (
              <TimelineControls
                events={eventsData?.events || []}
                currentTimeIndex={currentTimeIndex}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                onTimeIndexChange={setCurrentTimeIndex}
                onPlayPause={handlePlayPause}
                onSpeedChange={setPlaybackSpeed}
                onReset={handleReset}
              />
            )}
          </div>
        ) : (
          <div className="welcome-message">
            <h3>👋 Welcome to LILA DASHBOARD</h3>
            <p>Select a match from the left sidebar to start exploring!</p>
          </div>
        )}
      </main>

      <RightSidebar
        matches={matchesData?.matches || []}
        selectedMatchId={selectedMatchId}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;