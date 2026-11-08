# Практика Маркет

Учебный интернет-магазин и отдельный проект для твоих автотестов.

- **shop-app** — готовое приложение: Node.js, HTML, CSS и JavaScript. Все действия в интерфейсе обращаются к настоящему HTTP API.
- **autotests** — Java 17, JUnit 5, Selenide, REST Assured и Gradle Wrapper. Три стартовых теста: вход с фильтрацией каталога, фильтрация через API и применение промокода.

## Быстрый запуск

Нужны Node.js 22 или новее, JDK 17–25 и установленный Chrome. Gradle отдельно устанавливать не нужно. При первом запуске тестов нужен интернет для Gradle, библиотек и драйвера браузера.

Из папки этого документа:

**Терминал 1 — приложение:**

~~~powershell
node .\shop-app\server.js
~~~

Открой **http://127.0.0.1:3000**. Терминал должен оставаться открытым. Остановка — `Ctrl+C`.

**Терминал 2 — тесты с видимым браузером:**

~~~powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-tests.ps1 -Visible
~~~

`Bypass` действует только для этого запуска PowerShell; настройки системы не меняются. Скрипт использует `JAVA_HOME` или JDK курса из `F:\aqa-java-course\.tools\jdk`, если проект лежит в исходной папке. Путь к JDK курса вычисляется относительно скрипта.

Если JDK установлен в другом месте, перед запуском укажи свой путь:

~~~powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
~~~

| Что запустить | Команда из `qa-playground` |
|---|---|
| Все тесты без окна браузера | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-tests.ps1` |
| Только UI с окном браузера | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-tests.ps1 -Suite ui -Visible` |
| Только API | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-tests.ps1 -Suite api` |
| Один класс | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-tests.ps1 -Test '*CatalogUiTest' -Visible` |

Приложение нужно запустить **до тестов**. Сам тестовый проект не поднимает сервер.

## Обычные команды Gradle

Из папки `autotests`, если Java настроена в окружении:

~~~powershell
.\gradlew.bat test
.\gradlew.bat uiTest -Pheadless=false
.\gradlew.bat apiTest
.\gradlew.bat uiTest --tests "*CatalogUiTest" -Pheadless=false
~~~

На Linux/macOS: `sh ./gradlew test`. Wrapper уже лежит в проекте, включая JAR. Устанавливать npm-зависимости приложения не нужно: внешних зависимостей у него нет.

## Запуск одной кнопкой в IntelliJ IDEA

1. Открой папку **autotests** отдельным проектом и согласись импортировать Gradle.
2. В настройках Gradle выбери установленный JDK 17–25 и запуск через Wrapper.
3. В списке конфигураций появятся **UI tests**, **API tests** и **All tests**. `UI tests` открывает окно браузера.
4. Запусти магазин в терминале, затем нажми Run у нужной конфигурации.

Можно запускать отдельный Java-тест зелёной кнопкой рядом с методом. Для видимого браузера при таком запуске добавь VM option `-Dui.headless=false` или поменяй `ui.headless` в `src/test/resources/test.properties`.

Конфигурации `.run` рассчитаны на открытие **autotests** как корня проекта.

## Аккаунты

| Почта | Пароль | Поведение |
|---|---|---|
| `demo@practice.dev` | `practice123` | Успешный вход |
| `locked@practice.dev` | `practice123` | Аккаунт заблокирован |
| Любая другая комбинация | — | Ошибка входа |

**Каждый успешный вход создаёт отдельную сессию с пустой корзиной и историей.** Даже если два теста входят под одним логином, их данные независимы. Обновление страницы сохраняет текущую сессию; выход, новый вход или перезапуск сервера сбрасывает её данные. Срок сессии — 2 часа с момента входа.

Это учебное упрощение: общей истории пользователя в базе данных нет. Заказы не оплачиваются и никуда не отправляются.

## Что можно проверять

- Вход, неправильный пароль, заблокированный аккаунт, выход.
- Поиск по названию, категории, сортировка, наличие, пагинация.
- Карточка товара, добавление в корзину, количество и удаление.
- Промокод `PRACTICE10`: скидка 10% на товары.
- Доставка: 300 ₽; от 5 000 ₽ **после скидки** — бесплатно.
- Поля доставки и ошибки под конкретными полями.
- Создание заказа, очистка корзины, история заказов.
- Проверка одного сценария через UI и API.

Цены, наличие и расчёт заказа определяет сервер. Остатки фиксированы для упражнений и ограничивают количество одного товара в корзине; после покупки общий каталог не меняется.

Подробные правила: [API.md](API.md). Задания без готовых решений: [PRACTICE.md](PRACTICE.md).

## Структура тестового проекта

~~~text
autotests/
  build.gradle
  gradlew / gradlew.bat
  gradle/wrapper/
  .run/
  src/test/java/practice/
    config/TestConfig.java
    api/
      client/ShopApi.java
      tests/CatalogApiTest.java
      tests/CartApiTest.java
    ui/
      base/UiTestBase.java
      locators/LoginLocators.java
      locators/CatalogLocators.java
      pages/LoginPage.java
      pages/CatalogPage.java
      tests/CatalogUiTest.java
  src/test/resources/test.properties
~~~

Новые UI-тесты наследуй от `UiTestBase`: он создаёт и закрывает отдельный браузер для каждого теста. Методы действий добавляй в Page Object, локаторы — в `locators`.

Для API создавай новый `ShopApi` внутри каждого теста. Он хранит cookie только своего сценария. Добавляй `@Tag("api")` к API-классу; UI-тег наследуется от `UiTestBase`.

У элементов интерфейса есть `data-testid`. Например:

~~~java
By email = By.cssSelector("[data-testid='login-email']");
By cards = By.cssSelector("[data-testid='product-card']");
By headphone = By.cssSelector("[data-testid='product-card'][data-product-id='1']");
~~~

Заготовку можно расширять своим способом.

## Настройки и отчёты

Настройки по умолчанию: `autotests/src/test/resources/test.properties`.

Приоритет: JVM properties → переменные окружения → файл. При запуске Gradle параметры `-PbaseUrl`, `-Pheadless`, `-Pbrowser`, `-Ptimeout` передаются в JVM тестов:

~~~powershell
.\gradlew.bat uiTest -PbaseUrl=http://127.0.0.1:3001 -Pheadless=false
~~~

`BASE_URL`, `UI_HEADLESS`, `UI_BROWSER`, `UI_TIMEOUT_MS` — соответствующие переменные окружения. Скрипт `run-tests.ps1` всегда задаёт адрес через свой параметр `-BaseUrl`; по умолчанию порт 3000.

- Все тесты: `autotests/build/reports/tests/test/index.html`.
- Только UI: `autotests/build/reports/tests/uiTest/index.html`.
- Только API: `autotests/build/reports/tests/apiTest/index.html`.
- Скриншоты и HTML при падении проверок Selenide: `autotests/build/selenide`.

Если драйвер уже скачан, передай `-DriverPath 'C:\path\chromedriver.exe'` скрипту или `-PdriverPath=...` Gradle. Обычно Selenium Manager находит и скачивает драйвер сам.

Поменять порт приложения:

~~~powershell
$env:PORT = '3001'
node .\shop-app\server.js
~~~

Для тестов в другом терминале: `-BaseUrl http://127.0.0.1:3001`. Используй один и тот же хост (`127.0.0.1` или `localhost`) в рамках одной сессии.

## Проверки самого приложения

~~~powershell
node --test .\shop-app\test\app.test.js
~~~

Это 17 служебных проверок для поддержки магазина. Они запускают свой сервер на свободном порту и не затрагивают открытый вручную магазин. Основное место для твоих упражнений — Java-проект **autotests**.

## Документация библиотек

[Selenide](https://selenide.org/quick-start.html) · [REST Assured](https://rest-assured.io/) · [JUnit 5](https://docs.junit.org/5.14.4/overview.html) · [Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html)
