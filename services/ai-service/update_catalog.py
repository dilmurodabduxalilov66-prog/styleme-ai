import re

file_path = "C:/maxsus/services/ai-service/hairstyle_catalog.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove all tier lines
content = re.sub(r'\s*"tier":\s*"[^"]*",\n', '\n', content)

# Inject correctly
for i in range(1, 25):
    # Match EXACTLY this id's block start
    pattern = r"(\s+)" + str(i) + r":\s*\{\s*\"id\":\s*" + str(i) + r","
    tier = "FREE" if i <= 3 else "PRO"
    replacement = r'\g<1>' + str(i) + r': {\g<1>    "id": ' + str(i) + r',\g<1>    "tier": "' + tier + r'",'
    content = re.sub(pattern, replacement, content, count=1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed catalog tiers.")
