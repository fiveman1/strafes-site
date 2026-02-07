CREATE TABLE sessions (
    sessionHash char(64) NOT NULL,
    refreshToken TEXT NOT NULL,
    accessToken TEXT NOT NULL,
    refreshExpiresAt DATETIME NOT NULL,
    accessExpiresAt DATETIME NOT NULL,
    userId bigint NOT NULL,
    PRIMARY KEY (sessionHash)
);

CREATE TABLE settings (
    userId bigint NOT NULL,
    theme enum('dark', 'light') NOT NULL,
    game smallint NOT NULL,
    style smallint NOT NULL,
    maxDaysRelative smallint NOT NULL,
    countryCode varchar(6),
    PRIMARY KEY (userId)
);