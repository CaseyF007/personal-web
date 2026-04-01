#!/usr/bin/env node
/**
 * build-index.js
 * 扫描 data/posts/*.md 文件，解析 YAML frontmatter，生成 posts-index.json
 *
 * 用法: node scripts/build-index.js
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'data', 'posts');
const INDEX_FILE = path.join(POSTS_DIR, 'posts-index.json');

/**
 * 解析 Markdown 文件的 YAML frontmatter
 * 支持格式：
 * ---
 * title: 标题
 * date: 2026-01-01
 * tags: [标签A, 标签B]
 * ---
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yamlStr = match[1];
  const meta = {};

  for (const line of yamlStr.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();

    // 处理 YAML 数组: [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }
    // 去除引号包裹的字符串
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    meta[key] = value;
  }

  return meta;
}

// 扫描所有 .md 文件
const mdFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

if (mdFiles.length === 0) {
  console.log('⚠️  未找到 .md 文件');
  process.exit(0);
}

const posts = [];

for (const file of mdFiles) {
  const filePath = path.join(POSTS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const meta = parseFrontmatter(content);

  if (!meta || !meta.title) {
    console.warn(`⚠️  跳过 ${file}: 缺少 frontmatter 或 title`);
    continue;
  }

  const id = file.replace(/\.md$/, '');

  posts.push({
    id,
    title: meta.title,
    excerpt: meta.excerpt || '',
    date: meta.date || '',
    readTime: meta.readTime || '5 分钟阅读',
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    icon: meta.icon || '📝'
  });
}

// 按日期倒序排列
posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

// 写入 index
fs.writeFileSync(INDEX_FILE, JSON.stringify(posts, null, 2) + '\n', 'utf-8');

console.log(`✅ 已生成 posts-index.json (${posts.length} 篇文章)`);
posts.forEach(p => console.log(`   - ${p.id}: ${p.title}`));
