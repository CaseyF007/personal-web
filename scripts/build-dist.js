#!/usr/bin/env node
/**
 * build-dist.js
 * 将网站静态文件复制到 dist/ 目录，供 wrangler deploy 使用。
 * 只复制实际的网站文件，排除 node_modules、scripts 等非网站内容。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// 需要复制的文件和目录（相对于项目根目录）
const INCLUDE = [
  'index.html',
  'blog.html',
  'blog-post.html',
  'lab.html',
  'css',
  'js',
  'assets',
  'data',
  'lab',
];

/**
 * 递归复制目录
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 递归删除目录
 */
function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rmDir(p);
    } else {
      fs.unlinkSync(p);
    }
  }
  fs.rmdirSync(dir);
}

// 清理旧的 dist
rmDir(DIST);
fs.mkdirSync(DIST, { recursive: true });

let fileCount = 0;

for (const item of INCLUDE) {
  const src = path.join(ROOT, item);
  const dest = path.join(DIST, item);

  if (!fs.existsSync(src)) {
    console.warn(`⚠️  跳过 ${item}: 不存在`);
    continue;
  }

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
    console.log(`📁 ${item}/`);
  } else {
    fs.copyFileSync(src, dest);
    console.log(`📄 ${item}`);
    fileCount++;
  }
}

console.log(`\n✅ 已构建 dist/ 目录，准备部署`);
