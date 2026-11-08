package practice.api;

import java.util.List;
import java.util.stream.Stream;

import practice.api.client.ShopApi;

public interface CartInterface {

    ShopApi login(String email, String password);

    // path — адрес GET-запроса; itemField — поле после items, например id или
    // quantity.
    // Пустое itemField возвращает целиком элементы массива items.
    <T> List<T> getItems(String path, String itemField, Class<T> elementType);

    // Получает одиночное значение по полному JSON-пути, например subtotal или
    // shipping.
    <T> T getValue(String path, String fieldPath, Class<T> valueType);

    // Добавляет товар и возвращает количества всех позиций обновлённой корзины.
    <T> List<T> addProductCart(int productId, int quantity, Class<T> elementType);

    // Изменяет количество товара в корзине текущей сессии.
    void changeQuantity(int productId, int quantity);

    // Суммирует переданный список чисел.
    int totalSum(List<Integer> products);

    void remove(int id);

    void setCoupon(String coupon);
}
