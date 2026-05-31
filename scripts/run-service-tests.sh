#!/bin/bash
set -e

echo "======================================"
echo "Whiskey Tasting Service Tests"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Cleaning up any existing test containers${NC}"
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true

echo -e "${YELLOW}Step 2: Building test container${NC}"
docker-compose -f docker-compose.test.yml build

echo -e "${YELLOW}Step 3: Starting test containers${NC}"
docker-compose -f docker-compose.test.yml up -d

echo -e "${YELLOW}Step 4: Waiting for services to be healthy${NC}"
MAX_WAIT=120
WAIT_TIME=0
INTERVAL=2

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if docker-compose -f docker-compose.test.yml ps | grep -q "healthy"; then
        echo -e "${GREEN}✓ Services are healthy!${NC}"
        break
    fi

    if [ $WAIT_TIME -ge $MAX_WAIT ]; then
        echo -e "${RED}✗ Services failed to become healthy within ${MAX_WAIT} seconds${NC}"
        echo "Container logs:"
        docker-compose -f docker-compose.test.yml logs
        docker-compose -f docker-compose.test.yml down -v
        exit 1
    fi

    echo "Waiting... ($WAIT_TIME/$MAX_WAIT seconds)"
    sleep $INTERVAL
    WAIT_TIME=$((WAIT_TIME + INTERVAL))
done

echo -e "${YELLOW}Step 5: Running E2E tests against test container${NC}"
cd apps/frontend

if BASE_URL=http://localhost:3011 npm run test:e2e; then
    echo -e "${GREEN}✓ E2E tests passed!${NC}"
    TEST_RESULT=0
else
    echo -e "${RED}✗ E2E tests failed${NC}"
    TEST_RESULT=1
fi

cd ../..

echo -e "${YELLOW}Step 6: Cleaning up test containers${NC}"
docker-compose -f docker-compose.test.yml down -v

echo "======================================"
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Service tests completed successfully!${NC}"
else
    echo -e "${RED}✗ Service tests failed${NC}"
fi
echo "======================================"

exit $TEST_RESULT
