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

function toNumber(value: string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
