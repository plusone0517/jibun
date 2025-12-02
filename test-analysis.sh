#!/bin/bash

# Login and get user info
echo "=== Logging in ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"Test1234"}')

echo "$LOGIN_RESPONSE" | python3 -m json.tool

# Extract user_id
USER_ID=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('user', {}).get('id', ''))" 2>/dev/null)

if [ -z "$USER_ID" ]; then
  echo "Login failed"
  exit 1
fi

echo ""
echo "=== User ID: $USER_ID ==="
echo ""
echo "=== Running AI Analysis ==="

# Run analysis
ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:3000/api/analysis \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"selected_exam_ids\":[],\"use_questionnaire\":true}")

echo "$ANALYSIS_RESPONSE" | python3 -m json.tool | head -100
