package com.intellidoc.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Robust DataSource Configuration that automatically adapts Render, Railway,
 * and Heroku cloud PostgreSQL URIs (e.g. postgresql://user:pass@host/db or postgres://)
 * into standard JDBC format (jdbc:postgresql://host:port/db) with extracted credentials.
 */
@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:}")
    private String defaultUsername;

    @Value("${spring.datasource.password:}")
    private String defaultPassword;

    @Value("${spring.datasource.driver-class-name:}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = datasourceUrl;
        }

        HikariConfig config = new HikariConfig();

        // Check if URL is in cloud format: postgresql://user:pass@host/db or postgres://...
        boolean isCloudPostgres = rawUrl != null && (
                rawUrl.startsWith("postgres://") ||
                rawUrl.startsWith("postgresql://") ||
                (rawUrl.startsWith("jdbc:postgresql://") && rawUrl.contains("@"))
        );

        if (isCloudPostgres) {
            try {
                String uriString = rawUrl.startsWith("jdbc:") ? rawUrl.substring(5) : rawUrl;
                if (uriString.startsWith("postgres://")) {
                    uriString = "postgresql://" + uriString.substring(11);
                }

                URI dbUri = new URI(uriString);
                String host = dbUri.getHost();
                int port = dbUri.getPort() == -1 ? 5432 : dbUri.getPort();
                String path = dbUri.getPath();
                if (path != null && path.startsWith("/")) {
                    path = path.substring(1);
                }

                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + path;
                config.setJdbcUrl(jdbcUrl);
                config.setDriverClassName("org.postgresql.Driver");

                if (dbUri.getUserInfo() != null) {
                    String[] userParts = dbUri.getUserInfo().split(":", 2);
                    config.setUsername(userParts[0]);
                    if (userParts.length > 1) {
                        config.setPassword(userParts[1]);
                    }
                } else {
                    if (defaultUsername != null && !defaultUsername.isBlank()) {
                        config.setUsername(defaultUsername);
                    }
                    if (defaultPassword != null && !defaultPassword.isBlank()) {
                        config.setPassword(defaultPassword);
                    }
                }

                log.info("Initialized Cloud PostgreSQL DataSource: jdbc:postgresql://{}:{}/{}", host, port, path);
            } catch (Exception e) {
                log.error("Failed to parse cloud database URI: {}, using fallback", rawUrl, e);
                String fallbackUrl = rawUrl.startsWith("jdbc:") ? rawUrl : "jdbc:" + rawUrl;
                config.setJdbcUrl(fallbackUrl);
                config.setUsername(defaultUsername);
                config.setPassword(defaultPassword);
                if (driverClassName != null && !driverClassName.isBlank()) {
                    config.setDriverClassName(driverClassName);
                }
            }
        } else {
            // Standard JDBC URL (H2 in dev/test, or pre-configured jdbc:postgresql://)
            String finalUrl = (rawUrl != null && !rawUrl.isBlank()) ? rawUrl : "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL";
            if (!finalUrl.startsWith("jdbc:")) {
                finalUrl = "jdbc:" + finalUrl;
            }
            config.setJdbcUrl(finalUrl);
            config.setUsername(defaultUsername != null ? defaultUsername : "sa");
            config.setPassword(defaultPassword != null ? defaultPassword : "");
            if (driverClassName != null && !driverClassName.isBlank()) {
                config.setDriverClassName(driverClassName);
            }
        }

        // Hikari connection pool optimization
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(20000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }
}
