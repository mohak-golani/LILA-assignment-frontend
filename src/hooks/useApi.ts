import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

export const useMatches = (mapId?: string, date?: string) => {
  return useQuery({
    queryKey: ['matches', mapId, date],
    queryFn: () => apiService.getMatches(mapId, date),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMatchEvents = (
  matchId: string | null,
  page: number = 1,
  limit: number = 5000,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['match-events', matchId, page, limit],
    queryFn: () => apiService.getMatchEvents(matchId!, page, limit),
    enabled: enabled && !!matchId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useHeatmapData = (
  mapId: string | null,
  type: 'kills' | 'deaths' | 'traffic' = 'kills',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['heatmap', mapId, type],
    queryFn: () => apiService.getHeatmapData(mapId!, type),
    enabled: enabled && !!mapId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useMapConfigs = () => {
  return useQuery({
    queryKey: ['map-configs'],
    queryFn: () => apiService.getMapConfigs(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useMatchPlayers = (matchId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['match-players', matchId],
    queryFn: () => apiService.getMatchPlayers(matchId!),
    enabled: enabled && !!matchId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePlayerJourney = (
  matchId: string | null,
  userId: string | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['player-journey', matchId, userId],
    queryFn: () => apiService.getPlayerJourney(matchId!, userId!),
    enabled: enabled && !!matchId && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAllPlayerJourneys = (
  matchId: string | null,
  includeBots: boolean = true,
  includePlayers: boolean = true,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['all-player-journeys', matchId, includeBots, includePlayers],
    queryFn: () => apiService.getAllPlayerJourneys(matchId!, includeBots, includePlayers),
    enabled: enabled && !!matchId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};