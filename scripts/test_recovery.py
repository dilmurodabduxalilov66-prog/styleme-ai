import subprocess
import time
import os

BACKUP_DIR = "./local_backups"
os.makedirs(BACKUP_DIR, exist_ok=True)

print("=== STEP 1: Inserting Mock Data ===")
# Postgres
subprocess.run(['docker', 'exec', 'styleme-postgres', 'psql', '-U', 'styleme_user', '-d', 'styleme_db', '-c', 
                "CREATE TABLE IF NOT EXISTS backup_test (id serial PRIMARY KEY, data text);"
                "INSERT INTO backup_test (data) VALUES ('postgres_backup_success');"])

# Mongo
subprocess.run(['docker', 'exec', 'styleme-mongodb', 'mongosh', '-u', 'admin', '-p', 'MongoS3cure!', '--authenticationDatabase', 'admin', '--eval', 
                "db.getSiblingDB('styleme_db').backup_test.insertOne({data: 'mongo_backup_success'});"])

# Redis
subprocess.run(['docker', 'exec', 'styleme-redis', 'redis-cli', 'SET', 'backup_test_key', 'redis_backup_success'])

print("=== STEP 2: Running Backup ===")
# Postgres backup
with open(f"{BACKUP_DIR}/test.dump", "wb") as f:
    subprocess.run(['docker', 'exec', 'styleme-postgres', 'pg_dump', '-U', 'styleme_user', '-F', 'c', 'styleme_db'], stdout=f)

# Mongo backup
with open(f"{BACKUP_DIR}/test.archive", "wb") as f:
    subprocess.run(['docker', 'exec', 'styleme-mongodb', 'mongodump', '-u', 'admin', '-p', 'MongoS3cure!', '--authenticationDatabase', 'admin', '--archive'], stdout=f)

# Redis backup
subprocess.run(['docker', 'exec', 'styleme-redis', 'redis-cli', 'SAVE'])
subprocess.run(['docker', 'cp', 'styleme-redis:/data/dump.rdb', f'{BACKUP_DIR}/test.rdb'])


print("=== STEP 3: Deleting Data (Simulating Data Loss) ===")
subprocess.run(['docker', 'exec', 'styleme-postgres', 'psql', '-U', 'styleme_user', '-d', 'styleme_db', '-c', "DROP TABLE backup_test;"])
subprocess.run(['docker', 'exec', 'styleme-mongodb', 'mongosh', '-u', 'admin', '-p', 'MongoS3cure!', '--authenticationDatabase', 'admin', '--eval', "db.getSiblingDB('styleme_db').backup_test.drop();"])
subprocess.run(['docker', 'exec', 'styleme-redis', 'redis-cli', 'DEL', 'backup_test_key'])


print("=== STEP 4: Restoring Data ===")
# Postgres restore
with open(f"{BACKUP_DIR}/test.dump", "rb") as f:
    subprocess.run(['docker', 'exec', '-i', 'styleme-postgres', 'pg_restore', '-U', 'styleme_user', '-d', 'styleme_db', '--clean'], stdin=f)

# Mongo restore
with open(f"{BACKUP_DIR}/test.archive", "rb") as f:
    subprocess.run(['docker', 'exec', '-i', 'styleme-mongodb', 'mongorestore', '-u', 'admin', '-p', 'MongoS3cure!', '--authenticationDatabase', 'admin', '--archive', '--drop'], stdin=f)

# Redis restore
# For redis, we copy the dump.rdb back, and restart the container
subprocess.run(['docker', 'cp', f'{BACKUP_DIR}/test.rdb', 'styleme-redis:/data/dump.rdb'])
# Quick restart
subprocess.run(['docker', 'restart', 'styleme-redis'])
time.sleep(2) # wait for redis to load


print("=== STEP 5: Verifying Recovery ===")
# Verify Postgres
pg_res = subprocess.run(['docker', 'exec', 'styleme-postgres', 'psql', '-U', 'styleme_user', '-d', 'styleme_db', '-t', '-c', "SELECT data FROM backup_test LIMIT 1;"], capture_output=True, text=True)
if "postgres_backup_success" in pg_res.stdout:
    print("[PASS] PostgreSQL Recovery Successful!")
else:
    print("[FAIL] PostgreSQL Recovery Failed:", pg_res.stdout)

# Verify Mongo
mongo_res = subprocess.run(['docker', 'exec', 'styleme-mongodb', 'mongosh', '-u', 'admin', '-p', 'MongoS3cure!', '--authenticationDatabase', 'admin', '--quiet', '--eval', "db.getSiblingDB('styleme_db').backup_test.findOne().data;"], capture_output=True, text=True)
if "mongo_backup_success" in mongo_res.stdout:
    print("[PASS] MongoDB Recovery Successful!")
else:
    print("[FAIL] MongoDB Recovery Failed:", mongo_res.stdout)

# Verify Redis
redis_res = subprocess.run(['docker', 'exec', 'styleme-redis', 'redis-cli', 'GET', 'backup_test_key'], capture_output=True, text=True)
if "redis_backup_success" in redis_res.stdout:
    print("[PASS] Redis Recovery Successful!")
else:
    print("[FAIL] Redis Recovery Failed:", redis_res.stdout)

print("\n--- RECOVERY TEST COMPLETE ---")
