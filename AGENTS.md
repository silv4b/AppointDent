<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Response Protocol

Be concise in your answers, only provide the necessary information. Only give more details if requested.

## Commit protocol

Given the identified project modifications (git status):

1. Analyze all changes.
2. List all changes by scope (front, back, infrastructure, architecture, etc.).
3. Inform the user of the file batches along with commit messages for each batch, following semantic commit conventions.
    - Each batch must contain a commit message (in Portuguese) followed by the files.
    - Each batch must depend on the previous batch.
4. Only AFTER user confirmation should the commitments actually be made, as planned in the previous step.
5. After the commitments are executed, present a direct report with all the commitments made.
6. Ask the user if they want to perform a push action or if you can do it for them.

## Database backup

When the user requests a database backup, run:

```powershell
# Create date-named folder
$date = Get-Date -Format "yyyy-MM-dd"
$dir = ".db_backups/$date"
New-Item -ItemType Directory -Path $dir -Force

# Full dump (schema + data)
npx supabase db dump --local -f "$dir/backup-completo.sql"

# Schema only (uses pg_dump from the Supabase Postgres container)
docker exec supabase_db_appointdent pg_dump -U postgres `
  --schema-only --quote-all-identifier `
  --exclude-schema "information_schema|pg_*|_analytics|_realtime|_supavisor|auth|etl|extensions|pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_*|_timescaledb_*|topology|vault" `
  > "$dir/backup-schema.sql"
```

Both files are saved inside `.db_backups/<AAAA-MM-DD>/`. The directory is gitignored.

## Pagination

All tables in the system (current and future) **must** have pagination on their listing pages. Use server-side pagination with `LIMIT`/`OFFSET` (SQL) or `.range()` (Supabase JS). Default page size: 10 records. Include page size selector (10/20/50/100) and total record count display.
