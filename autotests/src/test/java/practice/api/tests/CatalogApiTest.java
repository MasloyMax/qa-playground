package practice.api.tests;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import practice.api.CartInterface;
import practice.api.client.ShopApi;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

@Tag("api")
@DisplayName("API каталога")
class CatalogApiTest {
    @Test
    @DisplayName("Категория audio возвращает два товара по возрастанию цены")
    void shouldFilterAndSortAudioProducts() {
        CartInterface api = new ShopApi();
        String path = "/products?size=100&category=audio&sort=price_asc";

        int total = api.getValue(path, "total", Integer.class);
        List<String> categories = api.getItems(path, "category", String.class);
        List<Integer> prices = api.getItems(path, "price", Integer.class);

        assertEquals(2, total);
        assertEquals(List.of("audio", "audio"), categories);
        assertEquals(List.of(3500, 4900), prices);
    }

    @Test
    @DisplayName("Категория workspace возвращает два товара с корректными типами полей")
    void shouldReturnWorkspaceProductsWithExpectedFieldTypes() {
        CartInterface api = new ShopApi();
        // Пустое имя поля возвращает сами товары; Object.class сохраняет исходные типы полей.
        List<Object> products = api.getItems("/products?size=100&category=workspace", "", Object.class);
        assertEquals(2, products.size());

        for (Object item : products) {
            Map<?, ?> product = assertInstanceOf(Map.class, item);
            assertInstanceOf(Integer.class, product.get("id"));
            assertInstanceOf(String.class, product.get("name"));
            assertInstanceOf(String.class, product.get("category"));
            assertEquals("workspace", product.get("category"));
            assertInstanceOf(String.class, product.get("categoryName"));
            assertInstanceOf(Integer.class, product.get("price"));
            assertInstanceOf(Integer.class, product.get("stock"));
            assertInstanceOf(String.class, product.get("icon"));
            assertInstanceOf(String.class, product.get("color"));
            assertInstanceOf(String.class, product.get("description"));
        }
    }

    @Test
    @DisplayName("3. Запросить товары в наличии")
    @Disabled("Учебная заготовка: реализуй сценарий и удали @Disabled")
    void shouldReturnOnlyInStockProducts() {
        // TODO: Запроси каталог с параметрами inStock=true и size=100.
        // Проверь: вернулось 7 товаров, у каждого stock > 0, товар с ID 8 отсутствует.
        // Практика: allMatch, noneMatch.
    }

    @Test
    @DisplayName("4. Найти недоступные товары в полном каталоге")
    @Disabled("Учебная заготовка: реализуй сценарий и удали @Disabled")
    void shouldFindUnavailableProducts() {
        // TODO: Получи весь каталог с size=100 и выбери товары с нулевым остатком.
        // Проверь: единственный недоступный товар — камера Pocket с ID 8.
        // Практика: filter, map, List.
    }

    @Test
    @DisplayName("5. Найти минимальную и максимальную цену")
    @Disabled("Учебная заготовка: реализуй сценарий и удали @Disabled")
    void shouldFindMinimumAndMaximumPrices() {
        // TODO: Получи весь каталог с size=100 и найди минимальную и максимальную цену.
        // Проверь: минимальная цена — 1200 рублей, максимальная — 8900 рублей.
        // Практика: min, max, Optional.
    }

    @Test
    @DisplayName("6. Выбрать товары с ценой от 5000 рублей")
    @Disabled("Учебная заготовка: реализуй сценарий и удали @Disabled")
    void shouldSelectProductsPricedFrom5000() {
        // TODO: Получи весь каталог с size=100 и выбери товары с ценой >= 5000 рублей.
        // Проверь: получились ровно три товара с ID 2, 7 и 8.
        // Практика: filter, map, Set.
    }

    @Test
    @DisplayName("7. Проверить пагинацию каталога")
    @Disabled("Учебная заготовка: реализуй сценарий и удали @Disabled")
    void shouldReturnDistinctProductsOnDifferentPages() {
        // TODO: Запроси первую и вторую страницы каталога с размером страницы size=6.
        // Проверь: на первой странице 6 товаров, на второй — 2; пересечений ID нет.
        // Проверь: обе страницы вместе содержат 8 уникальных ID.
        // Практика: List, Set, Collections.disjoint.
    }

    @Test
    @DisplayName("8. Запросить страницу после последней")
    @Disabled("Учебная заготовка: реализуй сценарий и удали @Disabled")
    void shouldReturnEmptyPageAfterLastPage() {
        // TODO: Запроси каталог с параметрами page=3 и size=6.
        // Проверь: список items пустой, а total остаётся равным 8.
        // Практика: isEmpty, работа с пустыми коллекциями.
    }
}
