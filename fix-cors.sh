#!/bin/bash
docker exec styleme-auth sh -c "sed -i 's/https:\/\/styleme.uz/https:\/\/stylemeai.uz/g' dist/services/auth-service/src/main.js"
docker restart styleme-auth

docker exec styleme-booking sh -c "sed -i 's/https:\/\/styleme.uz/https:\/\/stylemeai.uz/g' dist/services/booking-service/src/main.js"
docker restart styleme-booking

docker exec styleme-payment sh -c "sed -i 's/https:\/\/styleme.uz/https:\/\/stylemeai.uz/g' dist/services/payment-service/src/main.js"
docker restart styleme-payment

docker exec styleme-reputation sh -c "sed -i 's/https:\/\/styleme.uz/https:\/\/stylemeai.uz/g' dist/services/reputation-service/src/main.js"
docker restart styleme-reputation

docker cp /app/services/ai-service/main.py styleme-ai:/app/main.py
docker restart styleme-ai
