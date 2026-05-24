import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'public', 'editor-defaults.json');

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate structure
    if (typeof data !== 'object' || data === null) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write config file
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');

    // Auto git commit
    try {
      const { execSync } = require('child_process');
      execSync('git add public/editor-defaults.json public/videos/', {
        cwd: process.cwd(),
        stdio: 'pipe',
      });
      // Check if there are staged changes
      const status = execSync('git status --porcelain public/editor-defaults.json public/videos/', {
        cwd: process.cwd(),
        encoding: 'utf-8',
      });
      if (status.trim()) {
        execSync('git commit -m "chore: 更新教学内容编辑器配置"', {
          cwd: process.cwd(),
          stdio: 'pipe',
        });
      }
    } catch {
      // Git commit failed (might not be a git repo, or no changes), that's ok
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
