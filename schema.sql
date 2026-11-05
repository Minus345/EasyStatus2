DROP TABLE IF EXISTS event;

CREATE TABLE event(
    number INTEGER PRIMARY KEY,
    name TEXT,
    official INTEGER DEFAULT 0,
    printed INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1 not null
)