-- Create the Solvers table (Known users)
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'venter',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create the Vents table (Completely anonymous)
CREATE TABLE IF NOT EXISTS vents (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    vent_month_year TEXT NOT NULL,
    solver_id TEXT
);

CREATE TABLE IF NOT EXISTS magic_links (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anonymous_visitors (
    id TEXT PRIMARY KEY,
    problem_views INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);