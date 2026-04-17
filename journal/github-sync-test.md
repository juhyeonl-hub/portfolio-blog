---
title: "Testing GitHub Sync"
excerpt: "This post was auto-published by pushing a .md file to GitHub."
tags: [Dev, TIL]
---

## It Works!

This journal post was created by pushing a markdown file to the `journal/` folder in the portfolio-blog repository.

### How It Works

1. Push a `.md` file to `journal/` folder
2. GitHub sends a webhook to the backend
3. Backend fetches the raw file content
4. Parses YAML frontmatter (title, excerpt, tags)
5. Creates or updates the journal post

### Frontmatter Format

```yaml
---
title: "Your Post Title"
excerpt: "Short description"
tags: [Dev, TIL, Project]
---
```

No admin login needed. Just `git push`.
