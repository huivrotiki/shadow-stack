#!/bin/bash
# Test all speed profiles

echo "═══════════════════════════════════════"
echo "  SPEED PROFILES TEST"
echo "═══════════════════════════════════════"

API="http://localhost:3001"

for speed in slow medium fast; do
  echo ""
  echo "▸ Testing: $speed"
  
  # Change speed
  result=$(curl -s -X POST $API/api/speed -H "Content-Type: application/json" -d "{\"speed\":\"$speed\"}")
  echo "  Set: $result"
  
  # Test query
  start=$(date +%s%3N)
  response=$(curl -s -X POST $API/api/route -H "Content-Type: application/json" -d '{"prompt":"Hello"}')
  end=$(date +%s%3N)
  
  model=$(echo $response | jq -r '.model // "?"')
  provider=$(echo $response | jq -r '.provider // "?"')
  latency=$((end - start))
  
  echo "  Provider: $provider"
  echo "  Model: $model"
  echo "  Latency: ${latency}ms"
done

echo ""
echo "═══════════════════════════════════════"
echo "  DONE"
echo "═══════════════════════════════════════"
