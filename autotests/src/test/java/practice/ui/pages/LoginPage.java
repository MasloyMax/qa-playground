package practice.ui.pages;

import com.codeborne.selenide.SelenideDriver;

import static com.codeborne.selenide.Condition.enabled;
import static com.codeborne.selenide.Condition.visible;
import static practice.ui.locators.LoginLocators.*;

public class LoginPage {
    private final SelenideDriver browser;

    public LoginPage(SelenideDriver browser) {
        this.browser = browser;
    }

    public LoginPage open() {
        browser.open("/");
        browser.$(OPEN_LOGIN).click();
        return this;
    }

    public LoginPage submitCred(String email, String password){
        browser.$(EMAIL).setValue(email);
        browser.$(PASSWORD).setValue(password);
        browser.$(SUBMIT).click();
        return this;
    }

    public CatalogPage loginAs(String email, String password) {
        this.submitCred(email, password);
        return new CatalogPage(browser).shouldBeOpened();
    }

    public LoginPage submitClick(){
        browser.$(SUBMIT).click();
        return this;
    }

    public LoginPage emptyInputInLogin(){
        browser.$(ERROR).shouldBe(visible, enabled);
        return this;
    }
}
