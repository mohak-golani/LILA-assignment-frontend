import axios from 'axios';

const BASE_URL = "https://lila-backend-93kb.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout for large data requests
});

export interface Event {
  user_id: string;
  match_id: string;
  map_id: string;
  x: number;
  y: number;
  z: number;
  pixelX: number;
  pixelY: number;
  timestamp: string;
  event: string;
  isBot: boolean;
  date: string;
}

export interface PlayerInfo {
  user_id: string;
  isBot: boolean;
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
}

export interface PlayerJourney {
  user_id: string;
  isBot: boolean;
  path: Event[];
  actions: Event[];
  total_events: number;
}

export interface AllJourneysResponse {
  match_id: string;
  journeys: PlayerJourney[];
  total_players: number;
}

export interface Match {
  match_id: string;
  map_id: string;
  date: string;
  players: number;
  bots: number;
  totalEvents: number;
  duration: number;
}

export interface HeatmapPoint {
  pixelX: number;
  pixelY: number;
  x: number;
  z: number;
  intensity: number;
}

export interface HeatmapData {
  mapId: string;
  type: string;
  data: HeatmapPoint[];
}

export interface MapConfig {
  scale: number;
  originX: number;
  originZ: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export interface MatchesResponse {
  matches: Match[];
  total: number;
}

export interface EventsResponse {
  events: Event[];
  pagination: PaginationInfo;
}

// API Methods
export const apiService = {
  // Get all matches with optional filtering
  async getMatches(mapId?: string, date?: string): Promise<MatchesResponse> {
    const params = new URLSearchParams();
    if (mapId) params.append('map_id', mapId);
    if (date) params.append('date', date);

    const response = await api.get(`/api/matches?${params}`);
    return response.data;
  },

  // Get events for a specific match with pagination
  async getMatchEvents(
    matchId: string,
    page: number = 1,
    limit: number = 5000
  ): Promise<EventsResponse> {
    const response = await api.get(`/api/events/${matchId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get heatmap data for a specific map
  async getHeatmapData(
    mapId: string,
    type: 'kills' | 'deaths' | 'traffic' = 'kills'
  ): Promise<HeatmapData> {
    const response = await api.get(`/api/heatmap/${mapId}`, {
      params: { type }
    });
    return response.data;
  },

  // Get map configurations
  async getMapConfigs(): Promise<Record<string, MapConfig>> {
    const response = await api.get(`/api/maps`);
    return response.data;
  },

  // Get all players in a match
  async getMatchPlayers(matchId: string): Promise<{ match_id: string; players: PlayerInfo[]; total_players: number }> {
    const response = await api.get(`/api/players/${matchId}`);
    return response.data;
  },

  // Get a specific player's journey
  async getPlayerJourney(matchId: string, userId: string): Promise<PlayerJourney> {
    const response = await api.get(`/api/journey/${matchId}/${userId}`);
    return response.data;
  },

  // Get all player journeys for a match
  async getAllPlayerJourneys(
    matchId: string,
    includeBots: boolean = true,
    includePlayers: boolean = true
  ): Promise<AllJourneysResponse> {
    const response = await api.get(`/api/journeys/${matchId}?include_bots=${includeBots}&include_players=${includePlayers}`);
    return response.data;
  },

  // Health check
  async healthCheck(): Promise<any> {
    const response = await api.get(`/health`);
    return response.data;
  }
};

export default apiService;
