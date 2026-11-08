package practice.ui.base;

import com.codeborne.selenide.SelenideConfig;
import com.codeborne.selenide.SelenideDriver;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import practice.config.TestConfig;

@Tag("ui")
public abstract class UiTestBase {
    protected SelenideDriver browser;

    @BeforeEach
    void startBrowser() {
        browser = new SelenideDriver(new SelenideConfig()
                .baseUrl(TestConfig.baseUrl())
                .browser(TestConfig.get("ui.browser"))
                .headless(Boolean.parseBoolean(TestConfig.get("ui.headless")))
                .browserSize("1440x1000")
                .timeout(Long.parseLong(TestConfig.get("ui.timeout.ms")))
                .reportsFolder(System.getProperty("ui.reports", "build/selenide")));
    }

    @AfterEach
    void stopBrowser() {
        if (browser != null) browser.close();
    }
}
