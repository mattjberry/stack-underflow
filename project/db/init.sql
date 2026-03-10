-- Table of all users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);

-- Table of all channels on the site
CREATE TABLE channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by TEXT REFERENCES users(display_name),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table of all posts within a channel
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id),
  author_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table of replies on an individual post
CREATE TABLE replies (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id),
  -- can be nested
  parent_reply_id INTEGER REFERENCES replies(id),
  author_id INTEGER REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table of upvotes and downvotes on a post or reply
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  target_type TEXT NOT NULL,  -- 'post' or 'reply'
  target_id INTEGER NOT NULL,
  value SMALLINT NOT NULL,    -- +1 or -1
  UNIQUE(user_id, target_type, target_id)
);

-- Table of any media attachments on a post or reply
CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  target_type TEXT NOT NULL,  -- 'post' or 'reply'
  target_id INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  file_path TEXT NOT NULL
);