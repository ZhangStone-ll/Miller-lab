import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const { execSync } = require('child_process');
    const cwd = process.cwd();

    // Add all changes in public/ directory
    execSync('git add public/editor-defaults.json public/videos/', { cwd, stdio: 'pipe' });

    // Check if there are staged changes
    const status = execSync('git status --porcelain public/editor-defaults.json public/videos/', {
      cwd, encoding: 'utf-8',
    });

    if (status.trim()) {
      // Commit with timestamp
      const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      execSync(`git commit -m "chore: 更新教学内容配置 ${timestamp}"`, { cwd, stdio: 'pipe' });
    }

    // Push to remote
    // Get the remote URL and use the current branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
    execSync(`git push origin ${branch}`, { cwd, stdio: 'pipe', timeout: 30000 });

    return NextResponse.json({ success: true, branch });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
