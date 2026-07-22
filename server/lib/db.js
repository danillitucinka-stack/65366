import pkg from 'pg';
const { Pool } = pkg;

let pool;

export async function initDb() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/discord_clone';
  
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(500) DEFAULT NULL,
      status VARCHAR(20) DEFAULT 'offline',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS servers (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      owner_id UUID REFERENCES users(id),
      icon VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS server_members (
      user_id UUID REFERENCES users(id),
      server_id UUID REFERENCES servers(id),
      role VARCHAR(20) DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, server_id)
    );

    CREATE TABLE IF NOT EXISTS channels (
      id UUID PRIMARY KEY,
      server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) DEFAULT 'text',
      position INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY,
      channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS voice_states (
      user_id UUID REFERENCES users(id),
      channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
      server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, channel_id)
    );
  `);

  console.log('Database initialized');
}

export function getPool() {
  if (!pool) throw new Error('Database not initialized');
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  const client = await p.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
