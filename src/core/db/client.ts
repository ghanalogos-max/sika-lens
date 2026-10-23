import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// enableChangeListener lets useLiveQuery() re-render screens when rows change.
const sqlite = openDatabaseSync('sikalens.db', { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });
