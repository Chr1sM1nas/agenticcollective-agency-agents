import { supabase } from '../lib/supabaseClient';
import { Prediction } from '../types';

type PredictionStatus = Prediction['status'];
type PredictionType = Prediction['predictionType'];

interface PredictionRow {
  id: string;
  match_id: string;
  prediction_type: PredictionType;
  prediction_value: string;
  odds: number | null;
  xp_reward: number;
  status: PredictionStatus;
  created_at: string;
  matches:
    | {
        provider_match_id: string | null;
        home_team: string;
        away_team: string;
      }
    | {
    provider_match_id: string | null;
    home_team: string;
    away_team: string;
      }[]
    | null;
}

interface PersistPredictionInput {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  predictionType: PredictionType;
  predictionValue: string;
  odds?: number;
  xpReward: number;
}

function requireSupabaseClient() {
  if (!supabase) {
    throw new Error('Database is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

function asIsoTimestamp(value?: string): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

async function ensureMatchRecord(match: {
  providerMatchId: string;
  homeTeam: string;
  awayTeam: string;
}): Promise<{ id: string }> {
  const client = requireSupabaseClient();

  const { data: existingMatch, error: existingMatchError } = await client
    .from('matches')
    .select('id')
    .eq('provider_match_id', match.providerMatchId)
    .maybeSingle();

  if (existingMatchError) throw new Error(existingMatchError.message);
  if (existingMatch) return existingMatch as { id: string };

  const { data, error } = await client
    .from('matches')
    .upsert(
      {
        provider_match_id: match.providerMatchId,
        competition: 'Premier League',
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        home_team_emoji: '⚽',
        away_team_emoji: '⚽',
        kickoff: new Date().toISOString(),
        status: 'upcoming',
      },
      { onConflict: 'provider_match_id' }
    )
    .select('id')
    .single();

  if (error) {
    throw new Error(
      `Unable to map fixture ${match.homeTeam} vs ${match.awayTeam} into database matches table. ${error.message}`
    );
  }
  return data as { id: string };
}

function mapRowToPrediction(row: PredictionRow): Prediction {
  const matchRow = Array.isArray(row.matches) ? row.matches[0] : row.matches;

  return {
    id: `db-${row.id}`,
    dbId: row.id,
    matchId: matchRow?.provider_match_id ?? row.match_id,
    homeTeam: matchRow?.home_team ?? 'Home',
    awayTeam: matchRow?.away_team ?? 'Away',
    predictionType: row.prediction_type,
    prediction: row.prediction_value,
    odds: row.odds ?? undefined,
    xpReward: row.xp_reward,
    status: row.status,
    createdAt: asIsoTimestamp(row.created_at),
  };
}

export async function fetchUserPredictionsFromDatabase(userId: string): Promise<Prediction[]> {
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from('predictions')
    .select('id, match_id, prediction_type, prediction_value, odds, xp_reward, status, created_at, matches(provider_match_id, home_team, away_team)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as PredictionRow[]).map(mapRowToPrediction);
}

export async function persistPredictionToDatabase(userId: string, input: PersistPredictionInput): Promise<{ predictionId: string }> {
  const client = requireSupabaseClient();
  const match = await ensureMatchRecord({
    providerMatchId: input.matchId,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
  });

  const { data, error } = await client
    .from('predictions')
    .upsert(
      {
        user_id: userId,
        match_id: match.id,
        prediction_type: input.predictionType,
        prediction_value: input.predictionValue,
        odds: input.odds ?? null,
        xp_reward: input.xpReward,
        status: 'pending',
        resolved_at: null,
      },
      { onConflict: 'user_id,match_id,prediction_type' }
    )
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  return { predictionId: (data as { id: string }).id };
}

export async function persistPredictionOutcomeToDatabase(
  userId: string,
  predictionId: string,
  status: Exclude<PredictionStatus, 'pending'>
): Promise<void> {
  const client = requireSupabaseClient();

  const { error } = await client
    .from('predictions')
    .update({
      status,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', predictionId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
