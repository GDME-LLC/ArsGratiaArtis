import os
import sys

base_path = r'c:\ArsGratia.worktrees\copilot-worktree-2026-04-05T05-51-15'

# Create the three directories
dirs = [
    os.path.join(base_path, r'app\api\workflows\[id]\assets'),
    os.path.join(base_path, r'app\api\workflows\[id]\assets\[assetId]'),
    os.path.join(base_path, r'app\api\uploads\workflow-asset')
]

for dir_path in dirs:
    os.makedirs(dir_path, exist_ok=True)
    print(f'✓ Created: {dir_path}')

# Create .gitkeep file in workflow-asset directory
gitkeep_path = os.path.join(base_path, r'app\api\uploads\workflow-asset\.gitkeep')
with open(gitkeep_path, 'w') as f:
    pass
print(f'✓ Created: {gitkeep_path}')
print('Done!')
