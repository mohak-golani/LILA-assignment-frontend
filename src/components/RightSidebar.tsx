import React, { useMemo } from 'react';
import type { Match } from '../services/api';
import { useMatchEvents } from '../hooks/useApi';
import './RightSidebar.css';

interface RightSidebarProps {
  matches: Match[];
  selectedMatchId: string;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ matches, selectedMatchId }) => {
  const selectedMatch = matches.find(m => m.match_id === selectedMatchId);
  const totalMatches = matches.length;

  // Fetch real match events for deep AI insight analysis
  const { data: eventsData, isLoading } = useMatchEvents(
    selectedMatchId || null,
    1,
    50000,
    !!selectedMatchId
  );

  const formatMinSec = (ms: number) => {
    if (!ms) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate Event density (Events per minute)
  const eventDensity = useMemo(() => {
    if (!selectedMatch || !selectedMatch.duration) return 'N/A';
    const durationMinutes = selectedMatch.duration / 60000;
    if (durationMinutes === 0) return '0 EPM';
    const epm = selectedMatch.totalEvents / durationMinutes;
    return `${Math.round(epm).toLocaleString()} EPM`;
  }, [selectedMatch]);

  // 2. Insights (Anomaly Detection & Pattern Match)
  const insights = useMemo(() => {
    if (!eventsData || !eventsData.events.length) {
      return { peakCombatWindow: null, playstyle: null, firstKill: null, lastEvent: null };
    }

    const matchEvents = eventsData.events;

    // Find Peak Combat Window (1-minute sliding window)
    const combatEvents = matchEvents.filter(e =>
      ['Kill', 'Killed', 'BotKill', 'BotKilled'].includes(e.event)
    );

    // Naive sliding window logic for peak 1-minute window
    let maxCombatInWindow = 0;
    let peakWindowStart = 0;
    const windowMs = 60000; // 1 minute window

    for (let i = 0; i < combatEvents.length; i++) {
      let currentWindowCount = 0;
      const startTime = Number(combatEvents[i].timestamp);

      for (let j = i; j < combatEvents.length; j++) {
        if (Number(combatEvents[j].timestamp) - startTime <= windowMs) {
          currentWindowCount++;
        } else {
          break;
        }
      }

      if (currentWindowCount > maxCombatInWindow) {
        maxCombatInWindow = currentWindowCount;
        peakWindowStart = startTime;
      }
    }

    // Determine Playstyle pattern based on Event distributions
    const posEvents = matchEvents.filter(e => e.event === 'Position' || e.event === 'BotPosition').length;
    const lootEvents = matchEvents.filter(e => e.event === 'Loot').length;

    let playstyleDesc = "Standard Engagement";
    let playstyleIcon = "✅";
    if (posEvents > 0) {
      const lootRatio = lootEvents / posEvents;
      if (maxCombatInWindow > 15) {
        playstyleDesc = "Highly aggressive lobby pattern detected.";
        playstyleIcon = "⚔️";
      } else if (lootRatio > 0.05) {
        // More than 5% of positional moves involve looting
        playstyleDesc = "Lobby biased towards Heavy Looting behavior.";
        playstyleIcon = "💰";
      } else if (maxCombatInWindow < 3) {
        playstyleDesc = "Passive lobby. Survival and stealth prioritized.";
        playstyleIcon = "🛡️";
      }
    }

    // Match Highlights
    const firstKill = combatEvents.length > 0 ? combatEvents[0] : null;
    const lastEvent = matchEvents[matchEvents.length - 1];

    return {
      peakCombatWindow: {
        count: maxCombatInWindow,
        startStr: formatMinSec(peakWindowStart),
        endStr: formatMinSec(peakWindowStart + windowMs)
      },
      playstyleDesc,
      playstyleIcon,
      firstKill,
      lastEvent
    };
  }, [eventsData]);

  return (
    <aside className="right-sidebar">

      {/* AI Insights Section */}
      <div className="sidebar-section">
        <div className="section-header">
          <h3 className="section-title">INSIGHTS</h3>
        </div>

        <div className="insight-card anomaly">
          <div className="insight-header">
            <span className="insight-icon">⚠️</span>
            <h4>ANOMALY DETECTED</h4>
          </div>
          <p className="insight-text">
            {isLoading
              ? "Scanning temporal data..."
              : insights.peakCombatWindow?.count && insights.peakCombatWindow.count > 0
                ? `Peak intense combat anomaly detected between ${insights.peakCombatWindow.startStr} - ${insights.peakCombatWindow.endStr} (${insights.peakCombatWindow.count} deaths).`
                : "No significant combat anomaly detected."}
          </p>
        </div>

        <div className="insight-card pattern">
          <div className="insight-header">
            <span className="insight-icon">{isLoading ? "⏳" : insights.playstyleIcon}</span>
            <h4>PATTERN MATCH</h4>
          </div>
          <p className="insight-text">
            {isLoading
              ? "Analyzing coordinate distribution..."
              : insights.playstyleDesc}
          </p>
        </div>
      </div>

      {/* Match Statistics Section */}
      <div className="sidebar-section">
        <h3 className="section-title">MATCH STATISTICS</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Matches</div>
            <div className="stat-value">{totalMatches.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Event Density</div>
            <div className="stat-value">{eventDensity}</div>
          </div>
        </div>
      </div>

    </aside>
  );
};

export default RightSidebar;
