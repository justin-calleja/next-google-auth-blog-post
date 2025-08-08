import 'dotenv/config';
import * as schema from "./schema";
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle<typeof schema>(process.env.DATABASE_URL!);
