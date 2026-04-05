import os
import subprocess
import sys

# Use mkdir directly
os.system('mkdir "c:\\ArsGratia.worktrees\\copilot-worktree-2026-04-05T05-51-15\\app\\api\\workflows\\[id]\\assets"')
os.system('mkdir "c:\\ArsGratia.worktrees\\copilot-worktree-2026-04-05T05-51-15\\app\\api\\workflows\\[id]\\assets\\[assetId]"')
os.system('mkdir "c:\\ArsGratia.worktrees\\copilot-worktree-2026-04-05T05-51-15\\app\\api\\uploads\\workflow-asset"')

# Create .gitkeep
with open(r'c:\ArsGratia.worktrees\copilot-worktree-2026-04-05T05-51-15\app\api\uploads\workflow-asset\.gitkeep', 'w') as f:
    pass

print("Done")
