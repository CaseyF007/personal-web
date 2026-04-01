# Casey's Personal Website

嵌入式 Prompt 工程师的个人网站。

> Code is cheap. Show me the prompt.

## 技术栈

- HTML5 + CSS3 + JavaScript (ES6+)
- 纯前端，零框架依赖
- Canvas 粒子动画
- Markdown 博客系统 (marked.js)

## 发布博客

1. 在 `data/posts/` 下新建 `.md` 文件，格式如下：

```markdown
---
title: 文章标题
date: 2026-04-01
readTime: 5 分钟阅读
tags: [标签A, 标签B]
icon: 📝
excerpt: 文章摘要，显示在博客列表卡片上。
---

正文 Markdown 内容...
```

2. 生成索引：

```bash
npm run build:index
```

3. 推送至 GitHub，自动部署。

## 本地预览

```bash
npx serve
```

## 部署

推送至 GitHub 后，通过 Cloudflare Pages 自动部署。

