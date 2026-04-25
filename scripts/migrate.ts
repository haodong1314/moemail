import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
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
    
    // Create migrations directory and copy files from drizzle directory
    const migrationsDir = join(process.cwd(), 'migrations')
    const drizzleDir = join(process.cwd(), 'drizzle')
    
    if (!existsSync(migrationsDir)) {
      mkdirSync(migrationsDir, { recursive: true })
    }
    
    // Copy migration files
    const files = readdirSync(drizzleDir)
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const source = join(drizzleDir, file)
        const destination = join(migrationsDir, file)
        copyFileSync(source, destination)
      }
    }
    
    // Applying migrations
    console.log(`Applying migrations to ${mode} database: ${dbName}`)
    await execAsync(`wrangler d1 migrations apply ${dbName.trim()} --${mode.trim()}`)

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()
