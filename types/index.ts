export type SkiLevel = 'green' | 'blue' | 'black' | 'double black';
export type TerrainPreference = 'groomed' | 'moguls' | 'backcountry' | 'park';
export type SpeedPreference = 'relaxed' | 'moderate' | 'fast';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  location: string;
  years_skiing: number;
  preferred_terrain: TerrainPreference[];
  skill_level: SkiLevel;
  speed_preference: SpeedPreference;
  avatar_url?: string;
  created_at: string;
}
