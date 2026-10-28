CREATE TABLE graphics_backends (
    day DATE NOT NULL,
    backend enum('webgpu', 'webgl') NOT NULL,
    has_webgpu_api BOOLEAN NOT NULL,
    count INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (day, backend, has_webgpu_api)
);
