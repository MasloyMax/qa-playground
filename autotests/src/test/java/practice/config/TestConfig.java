package practice.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Properties;

public final class TestConfig {
    private static final Properties PROPERTIES = new Properties();

    static {
        try (InputStream input = TestConfig.class.getResourceAsStream("/test.properties")) {
            if (input == null) throw new IllegalStateException("test.properties not found");
            PROPERTIES.load(input);
        } catch (IOException error) {
            throw new ExceptionInInitializerError(error);
        }
    }

    private TestConfig() {}

    public static String get(String key) {
        String system = System.getProperty(key);
        if (system != null) return system;
        String environment = System.getenv(key.toUpperCase(Locale.ROOT).replace('.', '_'));
        return environment != null ? environment : PROPERTIES.getProperty(key);
    }

    public static String baseUrl() {
        return get("base.url");
    }
}
