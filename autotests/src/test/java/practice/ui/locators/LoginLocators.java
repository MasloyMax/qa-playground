package practice.ui.locators;

import org.openqa.selenium.By;

public final class LoginLocators {
    public static final By OPEN_LOGIN = By.cssSelector("[data-testid='login-open']");
    public static final By EMAIL = By.cssSelector("[data-testid='login-email']");
    public static final By PASSWORD = By.cssSelector("[data-testid='login-password']");
    public static final By SUBMIT = By.cssSelector("[data-testid='login-submit']");
    public static final By ERROR = By.cssSelector("[data-testid='login-error']");
    public static final By EMAIL_FIELD = By.cssSelector("#login-email");
    public static final By PASS_FIELD = By.cssSelector("#login-password");



    private LoginLocators() {}
}
