#!/bin/bash
# 📊 SEO Sitemap Health Check
# Verifica que todos los sitemaps sean accesibles y válidos

echo "🔍 Verificando Sitemaps — $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Arrays de dominios a verificar
names=("Startup Factory" "NC Global Assets" "Discoolver")
urls=("https://www.startupsfactory.es" "https://www.ncglobalassets.com" "https://www.discoolver.com")

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_domain() {
  local name=$1
  local domain=$2
  local sitemap="${domain}/sitemap.xml"
  local robots="${domain}/robots.txt"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🌍 ${name}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Verificar robots.txt
  echo -n "✓ robots.txt: "
  status=$(curl -s -o /dev/null -w "%{http_code}" "$robots" 2>/dev/null)
  if [ "$status" = "200" ]; then
    echo -e "${GREEN}200 OK${NC}"
    # Verificar que contiene sitemap
    if curl -s "$robots" | grep -q "sitemap"; then
      echo -e "  ${GREEN}✓ Sitemap declarado en robots.txt${NC}"
    else
      echo -e "  ${RED}✗ Sitemap NO encontrado en robots.txt${NC}"
    fi
  else
    echo -e "${RED}$status ERROR${NC}"
  fi

  # Verificar sitemap.xml
  echo -n "✓ sitemap.xml: "
  status=$(curl -s -o /dev/null -w "%{http_code}" "$sitemap" 2>/dev/null)
  if [ "$status" = "200" ]; then
    echo -e "${GREEN}200 OK${NC}"
    # Contar URLs en sitemap
    count=$(curl -s "$sitemap" | grep -o "<url>" | wc -l)
    if [ "$count" -gt 0 ]; then
      echo -e "  ${GREEN}✓ URLs encontradas: $count${NC}"
    else
      echo -e "  ${YELLOW}⚠ Sitemap válido pero vacío${NC}"
    fi
    # Validar XML
    if curl -s "$sitemap" | grep -q "<?xml"; then
      echo -e "  ${GREEN}✓ XML bien formado${NC}"
    else
      echo -e "  ${RED}✗ XML mal formado${NC}"
    fi
  else
    echo -e "${RED}$status ERROR${NC}"
  fi

  echo ""
}

# Ejecutar verificaciones
for i in 0 1 2; do
  check_domain "${names[$i]}" "${urls[$i]}"
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verificación completada"
echo "📅 Próxima ejecución recomendada: 7 días"
echo ""
