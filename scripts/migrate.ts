import { readFileSync, existsSync, mkdirSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'

const execAsync = promisify(exec)

interface D1Database {
  binding: string
  database_name: string
  database_id: string
}

interface WranglerConfig {
  d1_databases: D1Database[]
}

async function migrate() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2)
    const mode = args[0]

    if (!mode || !['local', 'remote'].includes(mode)) {
      console.error('Error: Please specify mode (local or remote)')
      process.exit(1)
    }

    // Read wrangler.json
    const wranglerPath = join(process.cwd(), 'wrangler.json')
    let wranglerContent: string
    
    try {
      wranglerContent = readFileSync(wranglerPath, 'utf-8')
    } catch (error) {
      console.error('Error: wrangler.json not found')
      process.exit(1)
    }

    // Parse wrangler.json
    const config = JSON.parse(wranglerContent) as WranglerConfig
    
    if (!config.d1_databases?.[0]?.database_name) {
      console.error('Error: Database name not found in wrangler.json')
      process.exit(1)
    }

    const dbName = config.d1_databases[0].database_name

    // Create drizzle directory if it doesn't exist
    const drizzleDir = join(process.cwd(), 'drizzle')
    if (!existsSync(drizzleDir)) {
      console.log('Creating drizzle directory...')
      mkdirSync(drizzleDir, { recursive: true })
    }

    // Generate migrations
    console.log('Generating migrations...')
    const generateCmd = 'drizzle-kit generate --schema ./app/lib/schema.ts --dialect sqlite --out ./drizzle'
    console.log(`Running: ${generateCmd}`)
    await execAsync(generateCmd, { cwd: process.cwd() })
    
    // Applying migrations
    console.log(`Applying migrations to ${mode} database: ${dbName}`)
    const migrateCmd = `wrangler d1 migrations apply ${dbName} --${mode} --migrations-dir ./drizzle`
    console.log(`Running: ${migrateCmd}`)
    await execAsync(migrateCmd, { cwd: process.cwd() })

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()
