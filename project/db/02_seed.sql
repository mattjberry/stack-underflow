-- =============================================================
-- Seed Data
-- Runs automatically after 01_schema.sql on first container start
-- =============================================================

-- -------------------------------------------------------------
-- USERS
-- Passwords are bcrypt hashes of the plaintext shown in comments
-- All test account passwords: "password123"
-- Admin password: "admin123"
-- -------------------------------------------------------------
INSERT INTO users (display_name, password_hash, role) VALUES
  ('admin',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  ('alice',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
  ('bob',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
  ('carol',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

-- -------------------------------------------------------------
-- CHANNELS
-- -------------------------------------------------------------
INSERT INTO channels (name, description, created_by) VALUES
  ('general',    'General programming discussion',         1),
  ('javascript', 'JavaScript and TypeScript questions',    2),
  ('databases',  'SQL, NoSQL, and everything data',        3);

-- -------------------------------------------------------------
-- POSTS
-- -------------------------------------------------------------
INSERT INTO posts (channel_id, author_id, title, body) VALUES
  (1, 2, 'Welcome to the Q&A board!',
         'Feel free to ask any programming questions here. Be respectful and provide as much context as possible when asking.'),

  (2, 3, 'Why does setTimeout run after synchronous code?',
         'I have the following code and I expected the timeout to run first since it is at the top, but it always prints last. Can someone explain why?\n\nsetTimeout(() => console.log("timeout"), 0);\nconsole.log("hello");'),

  (2, 4, 'What is the difference between == and === in JavaScript?',
         'I keep seeing both used in different codebases. When should I use one over the other?'),

  (3, 2, 'When should I use PostgreSQL vs MongoDB?',
         'Starting a new project and trying to decide between a relational and document database. What factors should I consider?'),

  (3, 3, 'How do I prevent SQL injection?',
         'I am building a search feature that takes user input and queries the database. What is the safest way to handle this?');

-- -------------------------------------------------------------
-- REPLIES
-- -------------------------------------------------------------
INSERT INTO replies (post_id, parent_reply_id, author_id, body) VALUES
  -- Replies to post 2 (setTimeout)
  (2, NULL, 1,
   'This is because of the JavaScript event loop. Synchronous code always runs to completion before any callbacks are executed, even if the timeout is set to 0ms.'),

  (2, NULL, 4,
   'To add to that — the call stack must be empty before the event loop picks up tasks from the queue. setTimeout just schedules a task, it does not interrupt running code.'),

  -- Nested reply to reply 1 (threading example)
  (2, 1, 3,
   'Thanks, that makes sense! So even setTimeout(fn, 0) is never truly immediate?'),

  (2, 3, 1,
   'Exactly. Zero just means "as soon as possible after the current stack clears", not "right now".'),

  -- Replies to post 3 (== vs ===)
  (3, NULL, 1,
   'Always prefer === (strict equality). It checks both value AND type, so 0 == "0" is true but 0 === "0" is false. The loose == operator does type coercion which leads to hard-to-spot bugs.'),

  -- Replies to post 4 (Postgres vs Mongo)
  (4, NULL, 4,
   'Use PostgreSQL when your data is relational and structured (users, orders, posts). Use MongoDB when your data is document-shaped and the schema changes frequently. For most web apps, Postgres is the safer default.'),

  -- Replies to post 5 (SQL injection)
  (5, NULL, 2,
   'Always use parameterised queries. Never concatenate user input directly into a SQL string. Most database libraries support this natively, for example with pg in Node: db.query("SELECT * FROM users WHERE id = $1", [userId])'),

  (5, NULL, 1,
   'Additionally, use an ORM like Prisma which handles parameterisation for you automatically. Even then it is good to understand why it matters.');

-- -------------------------------------------------------------
-- VOTES
-- -------------------------------------------------------------
INSERT INTO votes (user_id, target_type, target_id, value) VALUES
  -- Votes on posts
  (2, 'post', 2, 1),
  (3, 'post', 2, 1),
  (4, 'post', 2, 1),
  (1, 'post', 3, 1),
  (2, 'post', 3, 1),
  (4, 'post', 4, 1),
  (1, 'post', 4, 1),
  (3, 'post', 5, 1),
  (4, 'post', 5, 1),
  (2, 'post', 5, -1),

  -- Votes on replies
  (2, 'reply', 1, 1),
  (3, 'reply', 1, 1),
  (4, 'reply', 1, 1),
  (1, 'reply', 5, 1),
  (3, 'reply', 5, 1),
  (1, 'reply', 7, 1),
  (3, 'reply', 7, 1),
  (4, 'reply', 7, 1);