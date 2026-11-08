package practice.ui.pages;

import com.codeborne.selenide.SelenideDriver;

import static com.codeborne.selenide.CollectionCondition.size;
import static com.codeborne.selenide.Condition.attribute;
import static com.codeborne.selenide.Condition.visible;
import static practice.ui.locators.CatalogLocators.*;

public class CatalogPage {
    private final SelenideDriver browser;

    public CatalogPage(SelenideDriver browser) {
        this.browser = browser;
    }

    public CatalogPage shouldBeOpened() {
        browser.$(LOGOUT).shouldBe(visible);
        browser.$(GRID).shouldHave(attribute("aria-busy", "false"));
        return this;
    }

    public CatalogPage chooseCategory(String category) {
        browser.$(CATEGORY).selectOptionByValue(category);
        return this;
    }

    public CatalogPage shouldHaveProducts(int count) {
        browser.$$(PRODUCTS).shouldHave(size(count));
        return this;
    }

    public CatalogPage userNameCheck(){
        browser.$(USER_NAME).shouldBe(visible);
        return this;
    }
}
