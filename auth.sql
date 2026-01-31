CREATE TABLE sessions (
    sessionHash char(64) NOT NULL,
    refreshToken TEXT NOT NULL,
    accessToken TEXT NOT NULL,
    refreshExpiresAt DATETIME NOT NULL,
    accessExpiresAt DATETIME NOT NULL,
    userId bigint NOT NULL,
    PRIMARY KEY (sessionHash)
);