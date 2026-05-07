import postgres from 'postgres'

export const sql = postgres(process.env.DATABASE_URL!, {
  max: 30,
  idle_timeout: 20,
  connection: { timezone: 'UTC' }
})
