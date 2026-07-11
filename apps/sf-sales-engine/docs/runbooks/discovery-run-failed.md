# Runbook: Discovery Run Failed

**Síntoma**: `discovery_runs.error` no es null / Telegram alerta de run fallido.

## 1. Verificar el error
```sql
SELECT error, started_at, sources_used
FROM discovery_runs
WHERE client_id = '<uuid>'
ORDER BY started_at DESC
LIMIT 5;
```

## 2. Causas frecuentes

| Error | Causa | Fix |
|---|---|---|
| `apollo.rate_limit` | Límite mensual de Apollo alcanzado | Revisar quota en dashboard Apollo |
| `apify.actor_timeout` | Actor de Apify tardó más de 120s | Reducir batch_size en sources.yaml |
| `hunter.invalid_key` | API key de Hunter expirada | Rotar key en .env |
| `supabase.connection` | Supabase caído o URL incorrecta | Verificar SUPABASE_URL en Railway |

## 3. Re-ejecutar manualmente
```bash
curl -X POST $API_BASE_URL/discovery/run \
  -H "Content-Type: application/json" \
  -d '{"client_id": "<uuid>", "icp_id": "<uuid>"}'
```
