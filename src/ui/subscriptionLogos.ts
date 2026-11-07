import type { ImageSourcePropType } from 'react-native';

/** Tile colour behind a subscription mark; `fill` = artwork already includes its own background. */
export type SubscriptionLogo = { source: ImageSourcePropType; bg: string; fill?: boolean };

const LOGOS: Record<string, SubscriptionLogo> = {
  spotify: { source: require('../../assets/subscriptions/spotify.png'), bg: '#191414' },
  chatgpt: { source: require('../../assets/subscriptions/chatgpt.png'), bg: '#10A37F' },
  claude: { source: require('../../assets/subscriptions/claude.png'), bg: '#D97757' },
  netflix: { source: require('../../assets/subscriptions/netflix.png'), bg: '#000000' },
  youtube: { source: require('../../assets/subscriptions/youtube.png'), bg: '#FFFFFF' },
  apple_music: { source: require('../../assets/subscriptions/apple_music.png'), bg: '#FA2D55' },
  disney: { source: require('../../assets/subscriptions/disney.png'), bg: '#113CCF', fill: true },
  microsoft365: { source: require('../../assets/subscriptions/microsoft365.png'), bg: '#D24726' },
  icloud: { source: require('../../assets/subscriptions/icloud.png'), bg: '#3691F7' },
  adobe: { source: require('../../assets/subscriptions/adobe.png'), bg: '#EB1423' },
};

export function subscriptionLogo(id: string): SubscriptionLogo | null {
  return LOGOS[id] ?? null;
}
