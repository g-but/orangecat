# Backup & Restore Runbook

Backups
- Service: `backup` in `deployment/production/docker-compose.yml`
- Image: `prodrigestivill/postgres-backup-local:15`
- Schedule: `SCHEDULE` env (defaults to `0 2 * * *`)
- Retention: days/weeks/months via env variables
- Storage: `backup_data` volume mounted at `/backups`

Restore Procedure (local)
1. Identify the backup file in `backup_data` (e.g., `/backups/yourdb/yourdb-YYYY-MM-DD.sql.gz`).
2. Stop the app/web service (optional but recommended).
3. Restore into Postgres:
   ```bash
   gunzip -c /backups/yourdb/yourdb-YYYY-MM-DD.sql.gz | docker exec -i orangecat-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
   ```
4. Start services and verify.

Notes
- Test restores regularly in a staging environment.
- Consider offsite replication of backups (e.g., S3) for disaster recovery.

