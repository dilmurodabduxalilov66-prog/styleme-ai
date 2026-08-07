#!/bin/bash
docker exec styleme-auth sh -c "sed -i 's/FROM barbers/FROM barber_profiles/' dist/analytics.service.js"
docker exec styleme-auth sh -c "sed -i 's/FROM barbers WHERE \\"isSRank\\"/FROM barber_rankings WHERE \\"isSRank\\"/' dist/analytics.service.js"
docker restart styleme-auth
