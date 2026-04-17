-- V1: Initial schema for portfolio-blog

-- Admin users table (ID/Password + TOTP authentication)
CREATE TABLE admin_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    totp_secret VARCHAR(255),
    totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Portfolio projects
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    short_description VARCHAR(500),
    full_description TEXT,
    thumbnail_url VARCHAR(500),
    github_url VARCHAR(500),
    demo_url VARCHAR(500),
    tech_stack VARCHAR(500),
    display_order INTEGER NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Project screenshots
CREATE TABLE project_screenshots (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(300),
    display_order INTEGER NOT NULL DEFAULT 0
);

-- Resume sections
CREATE TABLE resume_sections (
    id BIGSERIAL PRIMARY KEY,
    section_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Journal/blog posts
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tags
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Post-tag relationship
CREATE TABLE post_tags (
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Guestbook entries (anonymous, nickname-based)
CREATE TABLE guestbook_entries (
    id BIGSERIAL PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Project reviews (anonymous, nickname-based)
CREATE TABLE project_reviews (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Page view analytics
CREATE TABLE page_views (
    id BIGSERIAL PRIMARY KEY,
    page_path VARCHAR(500) NOT NULL,
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_published ON projects(published);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_guestbook_created_at ON guestbook_entries(created_at DESC);
CREATE INDEX idx_project_reviews_project_id ON project_reviews(project_id);
CREATE INDEX idx_page_views_path ON page_views(page_path);
CREATE INDEX idx_page_views_viewed_at ON page_views(viewed_at DESC);
