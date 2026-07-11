#!/bin/bash

API_KEY="18180aa2a44751663e5f8b6e5736e38c3a821374301110124705576aca461e23"

echo "=== Verificando API CMS para los 3 clientes ==="
echo ""

echo "Salsa Burgers:"
curl -s "https://cms.startupsfactory.es/api/public/pages?project=salsaburgers" \
  -H "x-api-key: $API_KEY" | jq '.pages[] | {slug, sections: (.sections_json | length)}'

echo ""
echo "NC Global Assets:"
curl -s "https://cms.startupsfactory.es/api/public/pages?project=ncglobal" \
  -H "x-api-key: $API_KEY" | jq '.pages[] | {slug, sections: (.sections_json | length)}'

echo ""
echo "Startup Factory:"
curl -s "https://cms.startupsfactory.es/api/public/pages?project=startupsfactory" \
  -H "x-api-key: $API_KEY" | jq '.pages[] | {slug, sections: (.sections_json | length)}'
