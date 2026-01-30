CREATE TABLE users (
    userId bigint NOT NULL,
    username varchar(64) NOT NULL,
    displayName varchar(64) NOT NULL,
    createdAt datetime NOT NULL,
    profileUrl varchar(256) NOT NULL,
    thumbnailUrl: varchar(256),
    PRIMARY KEY (userId)
);