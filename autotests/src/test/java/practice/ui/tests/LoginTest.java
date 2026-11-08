package practice.ui.tests;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import practice.ui.base.UiTestBase;
import practice.ui.pages.LoginPage;

public class LoginTest extends UiTestBase {

    @BeforeEach
    void setUp(){
        new LoginPage(browser)
                .open();
    }

    @Test
    @DisplayName("Валидный вход")
    public void validateLogin(){
        new LoginPage(browser)
                .loginAs("demo@practice.dev","practice123")
                .userNameCheck();
    }

    @Test
    @DisplayName("Вход с неверным паролем")
    public void invalidateLogin(){
        new LoginPage(browser)
                .submitCred("123","123")
                .emptyInputInLogin();
    }
}


