DROP TABLE IF EXISTS event;

CREATE TABLE event(
    number INTEGER PRIMARY KEY,
    name TEXT,
    Alles_Eingetragen INTEGER DEFAULT 0,
    Ausgehangen INTEGER DEFAULT 0,
    Siegerehrung INTEGER DEFAULT 0,
    Im_Internet INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1 not null
)