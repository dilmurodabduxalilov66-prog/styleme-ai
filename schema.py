import replicate
import os
import json
from dotenv import load_dotenv

load_dotenv('/app/.env')
try:
    model = replicate.models.get('cjwbw/style-your-hair')
    version = model.versions.list()[0]
    print(json.dumps(version.openapi_schema, indent=2))
except Exception as e:
    print('Error:', e)
