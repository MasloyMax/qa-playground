package practice.api.client;

import io.restassured.filter.cookie.CookieFilter;
import io.restassured.http.ContentType;
import io.restassured.path.json.JsonPath;
import io.restassured.specification.RequestSpecification;
import practice.api.CartInterface;
import practice.config.TestConfig;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static io.restassured.RestAssured.post;

public class ShopApi implements CartInterface {
    // Создавай отдельный клиент в каждом тесте: этот фильтр хранит cookie его
    // сессии.
    private final CookieFilter cookies = new CookieFilter();

    public RequestSpecification request() {
        return given()
                .baseUri(TestConfig.baseUrl())
                .basePath("/api")
                .contentType(ContentType.JSON)
                .filter(cookies);
    }

    @Override
    public ShopApi login(String email, String password) {
        request()
                .body(Map.of("email", email, "password", password))
                .post("/auth/login")
                .then().statusCode(200);
        return this;
    }

    @Override
    public <T> List<T> getItems(String path, String itemField, Class<T> elementType) {
        String fieldPath = itemField.isBlank() ? "items" : "items.%s".formatted(itemField);
        JsonPath json = getJson(path);
        // Для Object.class сохраняем исходные JSON-типы без преобразования элементов.
        if (elementType == Object.class) {
            return json.getList(fieldPath);
        }
        return json.getList(fieldPath, elementType);
    }

    @Override
    public <T> T getValue(String path, String fieldPath, Class<T> valueType) {
        return getJson(path).getObject(fieldPath, valueType);
    }

    @Override
    public <T> List<T> addProductCart(
            int productId,
            int quantity,
            Class<T> elementType) {
        // Вход выполняется в тесте; здесь используется сессия текущего клиента.
        return request()
                .body(Map.of("productId", productId, "quantity", quantity))
                .post("/cart/items")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getList("items.quantity", elementType);
    }

    @Override
    public void changeQuantity(int productId, int quantity) {
        request()
                .body(Map.of("quantity", quantity))
                .patch("/cart/items/{id}", productId)
                .then()
                .statusCode(200);
    }

    @Override
    public int totalSum(List<Integer> products) {
        return products.stream()
                .mapToInt(Integer::intValue)
                .sum();
    }

    @Override
    public void remove(int id) {
        request()
                .delete("/cart/items/{id}", id)
                .then()
                .statusCode(200);
    }

    @Override
    public void setCoupon(String coupon) {
        request()
                .body(Map.of("code", coupon))
                .post("/cart/coupon")
                .then()
                .statusCode(200);
    }

    public  JsonPath getJson(String path) {
        return request()
                .get(path)
                .then()
                .statusCode(200)
                .extract()
                .jsonPath();
    }

}
