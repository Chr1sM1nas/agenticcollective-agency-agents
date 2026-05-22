import axios from 'axios';

const EPL_LEAGUE_ID = '4328';

export interface LiveMatchEvent {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: string;
  venue: string;
}

interface TheSportsDbLiveEvent {
  idEvent: string;
  idLeague: string;
  strLeague: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strProgress: string | null;
  strStatus: string | null;
  strVenue: string | null;
}

interface TheSportsDbLiveResponse {
  event?: TheSportsDbLiveEvent[];
}

type MatchFeedStatus = 'upcoming' | 'live' | 'finished';

export interface MatchFeedEvent {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: string;
  venue: string;
  kickoff: string;
  status: MatchFeedStatus;
}

interface TheSportsDbMatchEvent {
  idEvent: string;
  idLeague: string;
  strLeague: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strProgress: string | null;
  strStatus: string | null;
  strVenue: string | null;
  strTimestamp: string | null;
  dateEvent: string | null;
  strTime: string | null;
}

interface TheSportsDbEventListResponse {
  event?: TheSportsDbMatchEvent[];
  events?: TheSportsDbMatchEvent[];
}

function toNumber(value: string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isPremierLeagueEvent(event: Pick<TheSportsDbMatchEvent, 'idLeague' | 'strLeague'>): boolean {
  return event.idLeague === EPL_LEAGUE_ID || event.strLeague?.toLowerCase().includes('premier league');
}

function normalizeKickoff(event: Pick<TheSportsDbMatchEvent, 'strTimestamp' | 'dateEvent' | 'strTime'>): string {
  if (event.strTimestamp) {
    return event.strTimestamp;
  }

  if (event.dateEvent && event.strTime) {
    return `${event.dateEvent}T${event.strTime}Z`;
  }

  if (event.dateEvent) {
    return `${event.dateEvent}T00:00:00Z`;
  }

  return new Date().toISOString();
}

function normalizeStatus(rawStatus: string | null | undefined, fallback: MatchFeedStatus): MatchFeedStatus {
  const normalized = (rawStatus || '').toLowerCase();

  if (normalized.includes('ft') || normalized.includes('finished')) {
    return 'finished';
  }

  if (
    normalized.includes('live') ||
    normalized.includes('in play') ||
    normalized.includes('1h') ||
    normalized.includes('2h') ||
    normalized.includes('half')
  ) {
    return 'live';
  }

  return fallback;
}

function toMatchFeedEvent(event: TheSportsDbMatchEvent, fallbackStatus: MatchFeedStatus): MatchFeedEvent {
  return {
    id: event.idEvent,
    league: event.strLeague || 'Premier League',
    homeTeam: event.strHomeTeam,
    awayTeam: event.strAwayTeam,
    homeScore: toNumber(event.intHomeScore),
    awayScore: toNumber(event.intAwayScore),
    minute: event.strProgress || event.strStatus || (fallbackStatus === 'upcoming' ? 'Scheduled' : fallbackStatus === 'finished' ? 'FT' : 'LIVE'),
    venue: event.strVenue || 'Stadium',
    kickoff: normalizeKickoff(event),
    status: normalizeStatus(event.strStatus, fallbackStatus),
  };
}

async function fetchSportsDbEvents(path: string): Promise<TheSportsDbMatchEvent[]> {
  const apiKey = import.meta.env.VITE_THESPORTSDB_API_KEY || '3';
  const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/${path}`;
  const response = await axios.get<TheSportsDbEventListResponse>(url, { timeout: 8000 });
  return response.data.event ?? response.data.events ?? [];
}

export async function fetchPremierLeagueLiveMatches(): Promise<LiveMatchEvent[]> {
  const apiKey = import.meta.env.VITE_THESPORTSDB_API_KEY || '3';
  const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventslive.php?s=Soccer`;

  const response = await axios.get<TheSportsDbLiveResponse>(url, { timeout: 8000 });
  const events = response.data.event ?? [];

  return events
    .filter((event) => event.idLeague === EPL_LEAGUE_ID || event.strLeague?.toLowerCase().includes('premier league'))
    .map((event) => ({
      id: event.idEvent,
      league: event.strLeague || 'Premier League',
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: toNumber(event.intHomeScore),
      awayScore: toNumber(event.intAwayScore),
      minute: event.strProgress || event.strStatus || 'LIVE',
      venue: event.strVenue || 'Stadium',
    }));
}

export async function fetchPremierLeagueMatchFeed(): Promise<MatchFeedEvent[]> {
  const [liveResult, upcomingResult, recentResult] = await Promise.allSettled([
    fetchSportsDbEvents('eventslive.php?s=Soccer'),
    fetchSportsDbEvents(`eventsnextleague.php?id=${EPL_LEAGUE_ID}`),
    fetchSportsDbEvents(`eventspastleague.php?id=${EPL_LEAGUE_ID}`),
  ]);

  const allEvents = new Map<string, MatchFeedEvent>();

  if (liveResult.status === 'fulfilled') {
    liveResult.value
      .filter(isPremierLeagueEvent)
      .map((event) => toMatchFeedEvent(event, 'live'))
      .forEach((event) => allEvents.set(event.id, event));
  }

  if (upcomingResult.status === 'fulfilled') {
    upcomingResult.value
      .filter(isPremierLeagueEvent)
      .map((event) => toMatchFeedEvent(event, 'upcoming'))
      .forEach((event) => {
        if (!allEvents.has(event.id)) {
          allEvents.set(event.id, event);
        }
      });
  }

  if (recentResult.status === 'fulfilled') {
    recentResult.value
      .filter(isPremierLeagueEvent)
      .map((event) => toMatchFeedEvent(event, 'finished'))
      .forEach((event) => {
        if (!allEvents.has(event.id)) {
          allEvents.set(event.id, event);
        }
      });
  }

  if (
    liveResult.status === 'rejected' &&
    upcomingResult.status === 'rejected' &&
    recentResult.status === 'rejected'
  ) {
    throw new Error('Failed to load Premier League match feed');
  }

  return Array.from(allEvents.values());
}
