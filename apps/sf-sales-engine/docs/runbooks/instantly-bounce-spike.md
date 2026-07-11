# Runbook: Spike de bounces en Instantly

**Síntoma**: bounce rate > 5% en una campaña / alerta de Instantly.

## 1. Diagnóstico
```sql
SELECT outcome, COUNT(*) 
FROM outbound_log 
WHERE campaign_id = '<id>' 
GROUP BY outcome;
```

## 2. Pasos

1. **Pausar la campaña** inmediatamente en Instantly dashboard.
2. Verificar la calidad de los emails con Hunter:
   ```python
   # En Python
   await hunter.verify_email("email@dominio.com")
   ```
3. Si Hunter.io score < 70 → los emails no estaban verificados antes de enviar.
4. Fix: activar `hunter.verify_emails: true` en sources.yaml del cliente.
5. Re-verificar el batch afectado y filtrar bounces antes de reactivar.

## 3. Prevención
- `hunter.verify_emails: true` debe estar activo en TODOS los clientes.
- Instantly warming period mínimo 2 semanas para cuentas nuevas.
