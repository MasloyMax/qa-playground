package practice.ui.tests;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import practice.config.TestConfig;
import practice.ui.base.UiTestBase;
import practice.ui.pages.LoginPage;

@DisplayName("Каталог магазина")
class CatalogUiTest extends UiTestBase {
    @Test
    @DisplayName("После входа можно отфильтровать аудиотовары")
    void shouldFilterAudioProducts() {
        new LoginPage(browser)
                .open()
                .loginAs(TestConfig.get("demo.email"), TestConfig.get("demo.password"))
                .shouldBeOpened()
                .chooseCategory("audio")
                .shouldHaveProducts(2);
    }
}
