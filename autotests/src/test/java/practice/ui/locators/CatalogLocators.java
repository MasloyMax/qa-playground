package practice.ui.locators;

import org.openqa.selenium.By;

public final class CatalogLocators {
    // Информационная полоса с условием бесплатной доставки над шапкой.
    public static final By ANNOUNCEMENT = By.cssSelector(".announcement");

    // Логотип в шапке: ссылка на главную страницу каталога.
    public static final By HEADER_BRAND = By.cssSelector("header .brand");

    // Ссылка «Каталог» в главном меню.
    public static final By CATALOG_LINK = By.cssSelector("[data-testid='catalog-link']");

    // Ссылка «Мои заказы» в главном меню.
    public static final By ORDER_LINK = By.cssSelector("[data-testid='orders-link']");

    // Кнопка «Войти» в шапке, открывающая окно авторизации.
    public static final By OPEN_LOGIN = By.cssSelector("[data-testid='login-open']");

    // Имя пользователя в шапке; отображается после успешного входа.
    public static final By USER_NAME = By.cssSelector("[data-testid='user-name']");

    // Кнопка «Выйти»; отображается после успешного входа.
    public static final By LOGOUT = By.cssSelector("[data-testid='logout']");

    // Ссылка «Корзина» в шапке.
    public static final By CART = By.cssSelector("[data-testid='cart-link']");

    // Дополнительное имя для ссылки «Корзина»; использует тот же локатор, что CART.
    public static final By CART_LINK = CART;

    // Счётчик количества товаров рядом со ссылкой «Корзина».
    public static final By CART_COUNT = By.cssSelector("[data-testid='cart-count']");

    // Основной раздел каталога, содержащий баннер, фильтры и товары.
    public static final By CATALOG_VIEW = By.cssSelector("#catalog-view");

    // Заголовок баннера «Хороший день начинается с деталей».
    public static final By HERO_TITLE = By.cssSelector("#catalog-view .hero h1");

    // Ссылка «Найти своё»: прокручивает страницу к разделу товаров #products.
    public static final By FINF_THINK_BTN = By.cssSelector("a.button.dark[href='#products']");

    // Блок с якорем #products, к которому ведёт ссылка «Найти своё».
    public static final By PRODUCTS_SECTION = By.cssSelector("#products");

    // Заголовок каталога «Вещи с характером».
    public static final By CATALOG_TITLE = By.cssSelector("#catalog-title");

    // Форма с поиском, категориями, сортировкой и фильтром наличия.
    public static final By FILTERS = By.cssSelector("#filters");

    // Поле поиска товара по названию.
    public static final By SEARCH = By.cssSelector("[data-testid='search']");

    // Выпадающий список категорий товаров.
    public static final By CATEGORY = By.cssSelector("[data-testid='category']");

    // Выпадающий список сортировки по названию или цене.
    public static final By SORT = By.cssSelector("[data-testid='sort']");

    // Флажок «В наличии»: оставляет в каталоге только доступные товары.
    public static final By IN_STOCK_CHECKBOX = By.cssSelector("[data-testid='in-stock']");

    // Надпись «Найдено товаров» с количеством результатов поиска.
    public static final By PRODUCTS_COUNT = By.cssSelector("[data-testid='products-count']");

    // Кнопка «Сбросить фильтры».
    public static final By RESET_FILTERS = By.cssSelector("[data-testid='reset-filters']");

    // Контейнер карточек; aria-busy='false' означает завершение загрузки каталога.
    public static final By GRID = By.cssSelector("[data-testid='product-grid']");

    // Все карточки на текущей странице каталога; для коллекции используй browser.$$.
    public static final By PRODUCTS = By.cssSelector("[data-testid='product-card']");

    // Изображения-ссылки в карточках; открывают подробную информацию о товаре.
    public static final By PRODUCT_IMAGES = By.cssSelector("[data-testid='product-card'] .product-image");

    // Метки наличия в карточках: «В наличии» или «Скоро вернётся».
    public static final By PRODUCT_STOCK_LABELS = By.cssSelector("[data-testid='product-card'] .stock-label");

    // Названия категорий в карточках товаров.
    public static final By PRODUCT_CATEGORIES = By.cssSelector("[data-testid='product-card'] .product-category");

    // Названия-ссылки в карточках товаров; открывают окно выбранного товара.
    public static final By PRODUCT_NAMES = By.cssSelector("[data-testid='product-name']");

    // Цены в карточках; атрибут data-price содержит цену числом.
    public static final By PRODUCT_PRICES = By.cssSelector("[data-testid='product-price']");

    // Кнопки добавления в корзину; у недоступных товаров кнопка отключена.
    public static final By ADD_TO_CART_BUTTONS = By.cssSelector("[data-testid='add-to-cart']");

    // Сообщение «Ничего не нашлось» или ошибка загрузки внутри каталога.
    public static final By EMPTY_STATE = By.cssSelector("[data-testid='product-grid'] [data-testid='empty-state']");

    // Кнопка перехода на предыдущую страницу каталога.
    public static final By PREV_PAGE = By.cssSelector("[data-testid='prev-page']");

    // Номер текущей страницы и общее число страниц, например «1 / 2».
    public static final By PAGE_NUMBER = By.cssSelector("[data-testid='page-number']");

    // Кнопка перехода на следующую страницу каталога.
    public static final By NEXT_PAGE = By.cssSelector("[data-testid='next-page']");

    // Блок преимуществ магазина под списком товаров.
    public static final By BENEFITS = By.cssSelector("#catalog-view .benefits");

    // Промокод PRACTICE10 в блоке преимуществ магазина.
    public static final By PROMO_CODE = By.cssSelector("#catalog-view .benefits strong");

    // Модальное окно подробной информации о выбранном товаре.
    public static final By PRODUCT_DIALOG = By.cssSelector("#product-dialog");

    // Кнопка с крестиком для закрытия окна товара.
    public static final By CLOSE_PRODUCT = By.cssSelector("[data-close='product-dialog']");

    // Контейнер данных товара; заполняется после открытия окна товара.
    public static final By PRODUCT_DETAIL = By.cssSelector("#product-detail");

    // Изображение выбранного товара в модальном окне.
    public static final By DETAIL_IMAGE = By.cssSelector("#product-detail .product-image");

    // Название выбранного товара в модальном окне.
    public static final By PRODUCT_TITLE = By.cssSelector("#product-title");

    // Описание выбранного товара в модальном окне.
    public static final By PRODUCT_DESCRIPTION = By.cssSelector("#product-detail > p.muted");

    // Остаток выбранного товара в модальном окне, например «В наличии: 10».
    public static final By PRODUCT_STOCK = By.cssSelector("[data-testid='product-stock']");

    // Цена выбранного товара в модальном окне.
    public static final By DETAIL_PRICE = By.cssSelector("#product-detail .price");

    // Кнопка добавления товара в корзину из модального окна товара.
    public static final By DETAIL_ADD_TO_CART = By.cssSelector("[data-testid='detail-add-to-cart']");

    // Подвал страницы с логотипом и описанием магазина.
    public static final By FOOTER = By.cssSelector("footer");

    // Логотип-ссылка в подвале, возвращающий в каталог.
    public static final By FOOTER_BRAND = By.cssSelector("footer .brand");

    // Общая ошибка страницы, например при недоступности сервера.
    public static final By PAGE_ERROR = By.cssSelector("#page-error");

    // Всплывающее уведомление о результате действия пользователя.
    public static final By TOAST = By.cssSelector(  "[data-testid='toast']");

    // Запрещает создание экземпляров: все локаторы доступны через имя класса.
    private CatalogLocators() {}
}
