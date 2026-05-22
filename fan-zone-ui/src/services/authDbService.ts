import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { User } from '../types';

interface ProfileRow {
  id: string;
  display_name: string | null;
  age_verified: boolean | null;
  date_of_birth: string | null;
  team_affinity: string | null;
  favorite_players: string[] | null;
  xp_score: number | null;
  prediction_accuracy: number | null;
  collectibles_count: number | null;
}

interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

const PROFILE_COLUMNS =
  'id, display_name, age_verified, date_of_birth, team_affinity, favorite_players, xp_score, prediction_accuracy, collectibles_count';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Database is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

function mapDbUser(authUser: SupabaseAuthUser, profile?: ProfileRow | null): User {
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    displayName: profile?.display_name || authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Fan',
    ageVerified: Boolean(profile?.age_verified),
    dateOfBirth: profile?.date_of_birth ?? undefined,
    teamAffinity: profile?.team_affinity ?? 'Arsenal',
    favoritePlayers: profile?.favorite_players ?? [],
    xpScore: profile?.xp_score ?? 0,
    predictionAccuracy: profile?.prediction_accuracy ?? 0,
    collectiblesCount: profile?.collectibles_count ?? 0,
  };
}

async function getProfile(userId: string): Promise<ProfileRow | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ProfileRow | null;
}

export async function registerWithDatabase(input: RegisterInput): Promise<User> {
  const client = requireSupabase();

  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
      },
    },
  });

  if (error) {
    const normalizedMessage = error.message.toLowerCase();
    if (normalizedMessage.includes('already registered') || normalizedMessage.includes('already exists')) {
      throw new Error('user with existing email address exists - unable to create account');
    }
    if (normalizedMessage.includes('rate limit')) {
      throw new Error('Too many signup attempts right now. Please wait a few minutes and try again.');
    }
    if (normalizedMessage.includes('signups not allowed')) {
      throw new Error('New account registration is currently disabled on this project.');
    }
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error('user with existing email address exists - unable to create account');
  }

  // If email confirmation is enabled, Supabase may return a user without a session.
  // In that state, profile writes will fail RLS because auth.uid() is null.
  if (!data.session) {
    throw new Error('Account created. Check your email to verify your account, then log in.');
  }

  const { error: profileError } = await client.from('profiles').upsert({
    id: data.user.id,
    display_name: input.displayName,
    age_verified: false,
    xp_score: 0,
    prediction_accuracy: 0,
    collectibles_count: 0,
    team_affinity: 'Arsenal',
    favorite_players: [],
  });

  if (profileError) throw new Error(profileError.message);

  const profile = await getProfile(data.user.id);
  return mapDbUser(data.user, profile);
}

export async function loginWithDatabase(email: string, password: string): Promise<User> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Unable to sign in');

  let profile = await getProfile(data.user.id);

  if (!profile) {
    const displayName = data.user.user_metadata?.display_name || email.split('@')[0];
    const { error: profileError } = await client.from('profiles').upsert({
      id: data.user.id,
      display_name: displayName,
      age_verified: false,
      xp_score: 0,
      prediction_accuracy: 0,
      collectibles_count: 0,
      team_affinity: 'Arsenal',
      favorite_players: [],
    });
    if (profileError) throw new Error(profileError.message);
    profile = await getProfile(data.user.id);
  }

  return mapDbUser(data.user, profile);
}

export async function logoutFromDatabase(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function verifyUserAgeInDatabase(userId: string, dobIsoDate: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('profiles')
    .update({ age_verified: true, date_of_birth: dobIsoDate })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}
