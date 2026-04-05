const fs = require('fs');
const path = require('path');

const basePath = 'c:\\ArsGratia.worktrees\\copilot-worktree-2026-04-05T05-51-15';

// Create the three directories
const dirs = [
  path.join(basePath, 'app/api/workflows/[id]/assets'),
  path.join(basePath, 'app/api/workflows/[id]/assets/[assetId]'),
  path.join(basePath, 'app/api/uploads/workflow-asset')
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
  console.log('✓ Created:', dir);
});

// Create .gitkeep file in workflow-asset directory only
const gitkeepPath = path.join(basePath, 'app/api/uploads/workflow-asset/.gitkeep');
fs.writeFileSync(gitkeepPath, '');
console.log('✓ Created:', gitkeepPath);
