DROP TABLE IF EXISTS event;

CREATE TABLE event(
    number INTEGER PRIMARY KEY,
    name TEXT,
    official INTEGER not null,
    printed INTEGER not null,
    certificate INTEGER not null
)