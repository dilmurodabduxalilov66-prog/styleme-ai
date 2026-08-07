cat << 'EOF' > /app/tsconfig_new.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"]
}
EOF

cp /app/tsconfig_new.json /app/services/auth-service/tsconfig.json
cp /app/tsconfig_new.json /app/services/booking-service/tsconfig.json
cp /app/tsconfig_new.json /app/services/payment-service/tsconfig.json
cp /app/tsconfig_new.json /app/services/reputation-service/tsconfig.json

cd /app && docker compose -f docker-compose.prod.yml up -d --build
