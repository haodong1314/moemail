import { readFileSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import 'dotenv/config'

const execAsync = promisify(exec)

async function migrate() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2)
    const mode = args[0]

    if (!mode || !['local', 'remote'].includes(mode)) {
      console.error('Error: Please specify mode (local or remote)')
      process.exit(1)
    }

    // Get database name from environment variable
    const dbName = process.env.DATABASE_NAME || 'moemail-db'

    // Generate migrations
    console.log('Generating migrations...')
    await execAsync('drizzle-kit generate --schema ./app/lib/schema.ts --dialect sqlite --out drizzle')
    
    // Applying migrations
    console.log(`Applying migrations to ${mode} database: ${dbName}`)
    await execAsync(`wrangler d1 migrations apply ${dbName} --${mode}`)

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()
