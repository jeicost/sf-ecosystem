@AGENTS.md

# Reglas de operación — startup-factory-web

## Dev server — SIEMPRE usar el script, nunca `npm run dev` directo en background

Antes de abrir cualquier URL en el browser, ejecutar SIEMPRE:
```bash
~/Desktop/Claude/startup-factory-web/scripts/dev-open.sh [/ruta]
```

El script hace tres cosas:
1. Comprueba si `:3001` ya está corriendo → si sí, no lo vuelve a arrancar
2. Si no está, lo arranca con `nohup` y espera hasta que responda 200
3. Abre Chrome en la URL indicada

**NUNCA** hacer: `npm run dev &` seguido de `sleep N` seguido de `open` — el proceso muere entre llamadas Bash.

### Rutas de demo (testABC)
Cuando hay páginas de demo activas (hero-a/b/c, que-hacemos-a/b/c), abrirlas así:
```bash
./scripts/dev-open.sh /es/que-hacemos-a
```

### Log del servidor
Si algo falla: `cat /tmp/sf-dev.log`

## Deploy
```bash
cd ~/Desktop/Claude/startup-factory-web && ~/.local/bin/vercel --prod --yes
```
Solo deployar cuando el usuario lo pida explícitamente.
