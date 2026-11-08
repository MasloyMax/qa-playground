package practice.api.tests;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import practice.api.CartInterface;
import practice.api.client.ShopApi;
import practice.config.TestConfig;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Tag("api")
@DisplayName("API корзины")
class CartApiTest {
    @Test
    @DisplayName("Промокод уменьшает стоимость товара на 10 процентов")
    void shouldApplyCoupon() {
        ShopApi api = loginAsDemo();
        try {
            api.addProductCart(1, 1, Integer.class);
            int subtotal = api.getValue("/cart", "subtotal", Integer.class);
            assertEquals(4900, subtotal);

            api.request().body(Map.of("code", "PRACTICE10"))
                    .post("/cart/coupon")
                    .then().statusCode(200);

            int discount = api.getValue("/cart", "discount", Integer.class);
            int shipping = api.getValue("/cart", "shipping", Integer.class);
            int total = api.getValue("/cart", "total", Integer.class);
            assertEquals(490, discount);
            assertEquals(300, shipping);
            assertEquals(4710, total);
        } finally {
            api.request().post("/auth/logout").then().statusCode(204);
        }
    }

    @Test
    @DisplayName("Аудиотовары отсортированы по цене и имеют положительную стоимость")
    void shouldFilterAndSortAudioProducts() {
        CartInterface api = new ShopApi();
        // Получаем цены из ответа API как список целых чисел.
        List<Integer> prices = api.getItems(
                "/products?size=100&category=audio&sort=price_asc", "price", Integer.class);

        // Проверяем и состав списка, и порядок элементов.
        assertEquals(List.of(3500, 4900), prices);

        // Проверяем, что каждая цена положительная.
        boolean allPricesPositive = prices.stream()
                .allMatch(price -> price > 0);

        assertTrue(allPricesPositive);

        // Суммируем цены.
        int actualSum = prices.stream()
                .mapToInt(Integer::intValue)
                .sum();

        assertEquals(8400, actualSum);
    }

    @Test
    @DisplayName("Получить весь каталог")
    void shouldReturnAllProducts() {
        CartInterface api = new ShopApi();
        List<Integer> ids = api.getItems("/products?size=100", "id", Integer.class);

        long uniqueId = ids.stream()
                .distinct()
                .count();

        assertEquals(8, ids.size());
        assertEquals(ids.size(), uniqueId);
    }

    @Test
    @DisplayName("Группировка товаров по категорям")
    void groupByCategory() {
        CartInterface api = new ShopApi();

        Map<String, Long> expected = Map.of(
                "audio", 2L,
                "workspace", 2L,
                "home", 2L,
                "travel", 2L);

        List<String> priductCategory = api.getItems("/products?size=100", "category", String.class);

        Map<String, Long> checkCat = priductCategory.stream()
                .collect(Collectors.groupingBy(
                        category -> category,
                        Collectors.counting()));

        assertEquals(expected, checkCat);

    }

    // Для каждого сценария корзины создай отдельный ShopApi и выполни вход.

    @Test
    @DisplayName("9. Добавить несколько разных товаров")
    void shouldAddDifferentProducts() {
        int phoneExpected = 2;
        int miceExpected = 3;
        ShopApi api = loginAsDemo();
        CartInterface cart = api;

        cart.addProductCart(1, phoneExpected, Integer.class);
        List<Integer> headphones = cart.getItems("/cart", "quantity", Integer.class);

        int totalQuantity = cart.totalSum(headphones);

        assertEquals(phoneExpected, totalQuantity);

        cart.addProductCart(5, miceExpected, Integer.class);
        List<Integer> cartQuantities = cart.getItems("/cart", "quantity", Integer.class);

        assertEquals(2, cartQuantities.size());
        assertEquals(phoneExpected + miceExpected, cart.totalSum(cartQuantities));
        int subtotal = cart.getValue("/cart", "subtotal", Integer.class);
        assertEquals(4900 * phoneExpected + 1900 * miceExpected, subtotal);
    }

    @Test
    @DisplayName("10. Повторно добавить один товар")
    void shouldMergeRepeatedProductAdditions() {
        ShopApi api = loginAsDemo();
        CartInterface cart = api;

        cart.addProductCart(1, 1, Integer.class);
        List<Integer> productOne = cart.getItems("/cart", "quantity", Integer.class);
        assertEquals(List.of(1), productOne);

        cart.addProductCart(1, 2, Integer.class);
        List<Integer> productTwo = cart.getItems("/cart", "quantity", Integer.class);
        assertEquals(List.of(1 + 2), productTwo);
    }

    @Test
    @DisplayName("11. Изменить количество товара")
    void shouldUpdateProductQuantity() {
        // TODO: Добавь товар с ID 5 в количестве 1, затем измени количество на 3.
        // Проверь: количество — 3, subtotal — 5700 рублей, доставка бесплатная.
        // Практика: переменные, арифметика, условия.

        ShopApi api = loginAsDemo();
        CartInterface cart = api;

        cart.addProductCart(5, 1, Integer.class);
        cart.changeQuantity(5, 3);

        List<Integer> quantity = cart.getItems("/cart", "quantity", Integer.class);
        assertEquals(List.of(3), quantity);

        int subtotal = cart.getValue("/cart", "subtotal", Integer.class);
        assertEquals(5700, subtotal);

        int shipping = cart.getValue("/cart", "shipping", Integer.class);
        assertEquals(0, shipping);

    }

    @Test
    @DisplayName("12. Удалить одну позицию")
    void shouldRemoveOneCartItem() {
        // TODO: Добавь товары с ID 1 и ID 5 по одной штуке, затем удали товар с ID 1.
        // Проверь: осталась одна позиция с ID 5, итог с доставкой — 2200 рублей.
        // Практика: коллекции, сравнение состава.
        ShopApi api = loginAsDemo();
        CartInterface cart = api;

        cart.addProductCart(1, 1, Integer.class);
        cart.addProductCart(5, 1, Integer.class);

        cart.remove(1);

        int subtotal = cart.getValue("/cart", "subtotal", Integer.class);

        assertEquals(1900, subtotal);
    }

    @Test
    @DisplayName("13. Проверить границу бесплатной доставки")
    void shouldProvideFreeShippingAtThreshold() {
        // TODO: Добавь товар с ID 5 в количестве 2 и товар с ID 6 в количестве 1.
        // Проверь: subtotal равен ровно 5000 рублей, стоимость доставки — 0 рублей.
        // Практика: граничные значения, расчёты.

        ShopApi api = loginAsDemo();
        CartInterface cart = api;

        cart.addProductCart(5, 2, Integer.class);
        cart.addProductCart(6, 1, Integer.class);

        int subtotal = cart.getValue("/cart ", "subtotal", Integer.class);
        assertEquals(5000, subtotal);

        int shipping = cart.getValue("/cart", "shipping", Integer.class);
        assertEquals(0, shipping);
    }

    @Test
    @DisplayName("14. Промокод меняет стоимость доставки")
    void shouldRecalculateShippingAfterCoupon() {
        // TODO: Добавь товар с ID 7 в количестве 1 и примени промокод PRACTICE10.
        // Проверь: до промокода сумма товаров — 5400 рублей, доставка бесплатная.
        // Проверь: после скидки товары стоят 4860 рублей, доставка — 300, итог — 5160.
        // Практика: арифметика, if, бизнес-правила.
        ShopApi api = loginAsDemo();
        CartInterface cart = api;
        cart.addProductCart(7, 1, Integer.class);

        cart.setCoupon("PRACTICE10");

        var json = api.getJson("/cart");

        int total = json.getInt("total");
        int shipping = json.getInt("shipping");
        int subtotal = json.getInt("subtotal");
        int discount = json.getInt("discount");

        assertEquals(subtotal - discount + shipping, total);
        assertEquals(subtotal * 10 / 100, discount);
    }

    @Test
    @DisplayName("15. Применить промокод повторно")
    @Disabled("Учебная заготовка: реализуй сценарий и удали @Disabled")
    void shouldKeepDiscountOnRepeatedCouponApplication() {
        // TODO: Добавь товары с ID 1 и ID 5 по одной штуке и дважды примени PRACTICE10.
        // Проверь: скидка после первого и после второго применения равна 680 рублям.
        // Практика: состояние объекта, сравнение значений.
    }

    @Test
    @DisplayName("16. Превысить остаток товара")
    @Disabled("Учебная заготовка: реализуй сценарий и удали @Disabled")
    void shouldRejectQuantityExceedingStock() {
        // TODO: Подготовь непустую корзину и попробуй добавить товар с ID 1 в
        // количестве 9.
        // Проверь: сервер вернул статус 409; повторно запроси корзину и проверь её
        // содержимое.
        // Проверь: после отклонённого добавления прежние позиции и количества
        // сохранились.
        // Практика: объекты, коллекции, проверки ошибок.
    }

    @Test
    @DisplayName("17. Очистить корзину")
    @Disabled("Учебная заготовка: реализуй сценарий и удали @Disabled")
    void shouldClearCart() {
        // TODO: Добавь товары в корзину, затем очисти её.
        // Проверь: список позиций пустой, количество, стоимость доставки и итог равны
        // нулю.
        // Практика: пустые коллекции, несколько проверок.
    }

    @Test
    @DisplayName("18. Проверить независимость сессий")
    @Disabled("Учебная заготовка: реализуй сценарий и удали @Disabled")
    void shouldKeepSessionsIndependent() {
        // TODO: Создай два отдельных ShopApi и авторизуй оба одним и тем же логином.
        // Добавь товар через первый клиент, затем запроси обе корзины.
        // Проверь: у первой сессии есть добавленный товар, у второй корзина пустая.
        // Практика: объекты, поля экземпляра, изоляция состояния.
    }

    private ShopApi loginAsDemo() {
        return new ShopApi().login(
                TestConfig.get("demo.email"),
                TestConfig.get("demo.password"));
    }

}
