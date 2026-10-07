FROM mysql:8.4

COPY database.sql /docker-entrypoint-initdb.d/01-bateponto.sql