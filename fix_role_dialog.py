import re

file_path = r'd:\Apps\Loop Doc Manager\frontend\pages\settings\index.vue'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the @click="openRoleDialog" with @click="openRoleDialog()" for the Create button
# Only replace the one that doesn't have an argument
new_content = re.sub(r'(@click="openRoleDialog)(")', r'\1()\2', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated openRoleDialog calls.")
