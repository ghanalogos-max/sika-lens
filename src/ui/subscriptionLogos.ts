import type { ImageSourcePropType } from 'react-native';

/** Tile colour behind a subscription mark; `fill` = artwork already includes its own background. */
export type SubscriptionLogo = { source: ImageSourcePropType; bg: string; fill?: boolean };

const LOGOS: Record<string, SubscriptionLogo> = {
  spotify: { source: require('../../assets/subscriptions/spotify.jpg'), bg: '#191414', fill: true },
  chatgpt: { source: require('../../assets/subscriptions/chatgpt.jpg'), bg: '#10A37F', fill: true },
  claude: { source: require('../../assets/subscriptions/claude.jpg'), bg: '#D97757', fill: true },
  netflix: { source: require('../../assets/subscriptions/netflix.jpg'), bg: '#000000', fill: true },
  youtube: { source: require('../../assets/subscriptions/youtube.jpg'), bg: '#FFFFFF', fill: true },
  apple_music: { source: require('../../assets/subscriptions/apple_music.jpg'), bg: '#FA2D55', fill: true },
  disney: { source: require('../../assets/subscriptions/disney.jpg'), bg: '#113CCF', fill: true },
  microsoft365: { source: require('../../assets/subscriptions/microsoft365.jpg'), bg: '#D24726', fill: true },
  icloud: { source: require('../../assets/subscriptions/icloud.jpg'), bg: '#3691F7', fill: true },
  adobe: { source: require('../../assets/subscriptions/adobe.jpg'), bg: '#EB1423', fill: true },
};

export function subscriptionLogo(id: string): SubscriptionLogo | null {
  return LOGOS[id] ?? null;
}
