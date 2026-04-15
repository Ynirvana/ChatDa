-- Auto-run on first-init of the postgres volume (ignored on existing volumes).
-- Creates a dedicated dev database alongside the prod one.
CREATE DATABASE chatda_dev OWNER chatda;
