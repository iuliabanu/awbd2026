# Project 4

This project contains examples of Thymeleaf views. In the next steps we will:
- add mappers.
- add services.
- add controllers.
- interact with Thymeleaf views.
- add validations and error handling.
- add examples tests for Controllers using Mockito.

Requirements:
- Java 17 or higher
- Maven or Gradle
- MySQL database (optional, for testing with MySQL) available at localhost:3306 with database name awbd, username awbd and password awbd.
- Docker (optional, for running MySQL in a container)
- IDE with Lombok plugin (optional, for using Lombok annotations)
- GitHub Copilot access (connected account with access to the repository)
- Mermaid plugin for visualizing ERD diagrams.
- IntelliJ IDEA plugin for building custom plugins: Plugin DevKit -> IntelliJ Platform Plugin

### Project configuration

This project was generated with Spring Initializr. The following dependencies were added: Spring Data JPA, H2 Database, Lombok, MySQL Driver, Spring Web.
https://start.spring.io/. We will add JPA annotation to the POJOs in the ERD schema below.


![External Image](https://bafybeigkeme7uhrm2fenjx5kyrfcqz3525g3dpxrnn2piuq2bjku2zk4fu.ipfs.w3s.link/erd_jpa.png)

### Mappers
#### DTOs - Data Transfer Objects
Data Transfer Objects are POJOs used to encapsulate
and transfer data between different layers of an application:
- between the presentation layer (UI) and the business logic layer.
- between the business logic layer and the data access layer.

Advantages of using DTOs are:
- serialization: easily converted into json, xml or other formats.
- reduce unnecessary data-transfer: include only relevant information.
- reduce dependencies, different parts of the application are decoupled.

We can define mappers, or we can use libraries such as _MapStruct_ or _ModelMapper_.

**ModelMapper** automatically maps fields with the same names and data types.
ModelMapper supports complex mapping scenarios without the need for explicit mapping interfaces.

**MapStruct** requires explicit mapping interfaces to be defined by the developers.


ModelMapper relies on reflection while MapStruct uses compile-time code generation.
Hence, MapStruct has a better performance, being slightly faster.

#### Step 1
Add packages dto and mappers.
Add DTOs and mappers for Category.

```java
@Setter
@Getter
@AllArgsConstructor
public class CategoryDTO {

    private Long id;
    private String name;

}
```

```java
@Component
public class CategoryMapper {
  public CategoryDTO toDto(Category category) {
    Long id = category.getId();
    String name= category.getName();
    return new CategoryDTO(id, name);
  }

  public Category toCategory(CategoryDTO categoryDTO) {
    Category category = new Category();
    category.setId(categoryDTO.getId());
    category.setName(categoryDTO.getName());
    return category;
  }
}
```


#### Step 2
Check the Gradle dependency for model-mapper and
create a bean of type ModelMapper in
com.awbd.lab4.config

```groovy
dependencies {
    implementation 'org.modelmapper:modelmapper:3.2.6'
}
```

```java
@Configuration
public class ModelMapperConfig {

  @Bean
  public ModelMapper modelMapper() {
    return new ModelMapper();
  }
}
```

#### Step 3
Add DTO class for Product. We will map Product to ProductDTO with ModelMapper, hence we
don't need to write a specific mapper interface.

First add `InfoDTO` to hold the product description and image id without exposing the `Info` entity
or its circular back-reference to `Product`:

```java
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class InfoDTO {
    private Long id;
    private String description;
    private byte[] photo;
}
```

Then define `ProductDTO` with flat scalar fields. Instead of embedding the `Participant` entity use
`sellerId`, and instead of a `List<Category>` entity list use `List<Long> categoryIds`.
This keeps the DTO decoupled from the JPA model and avoids circular graph issues during mapping:

```java
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ProductDTO {

  private Long id;
  private String name;
  private String code;
  private Double reservePrice;
  private Boolean restored;
  private Currency currency;

  private InfoDTO info;       
  private Long sellerId;      
  private List<Long> categoryIds; 

}
```

#### Step 4
Include in the Gradle configuration the MapStruct dependency and annotation processor.
Annotation processors are tools that process
annotations in Java source code.
MapStruct and Lombok use annotation processors
to generate code during the compilation phase.
We must configure MapStruct to generate mappers during the compilation process based on the annotations.

```groovy
dependencies {
    implementation 'org.mapstruct:mapstruct:1.6.3'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.6.3'
}
```

If Lombok is already enabled in the project, keep its existing `compileOnly` and `annotationProcessor` entries in `build.gradle` alongside the MapStruct entries above.

#### Step 5
Add a DTO and mapper for Participant.

```java
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ParticipantDTO {

    private Long id;
    private String lastName;
    private String firstName;
    private java.util.Date birthDate;

    private List<Long> productIds; 
    

}
```

A bean implementing ParticipantMapper will be automatically created.

```java
@Mapper(componentModel = "spring")
public interface ParticipantMapper {
    ParticipantDTO toDto (Participant participant);
    Participant toParticipant (ParticipantDTO participantDTO);
}
```

### Stereotype annotations

Stereotype annotations are used for classifications:

- **@Service**: Represents a component implementing the business logic, typically used in the service layer.

- **@Repository**: Represents a component in the persistence layer, used for database repository operations.

#### Step 6
Add a new package com.awbd.lab4.services and a new interface com.awbd.lab4.services._ProductService_:
Implement com.awbd.lab4.services.ProductService using a bean of type _ProductRepository_.

```java
public interface ProductService {
  List<ProductDTO> findAll();
  ProductDTO findById(Long id);
  ProductDTO save(ProductDTO product);
  void deleteById(Long id);
  void savePhotoFile(ProductDTO productDTO, MultipartFile file);
}
```

```java
@Slf4j
@Service
public class ProductServiceImpl implements ProductService {
  ProductRepository productRepository;
  ParticipantRepository participantRepository;
  CategoryRepository categoryRepository;
  ModelMapper modelMapper;

  public ProductServiceImpl(ProductRepository productRepository,
                            ParticipantRepository participantRepository,
                            CategoryRepository categoryRepository,
                            ModelMapper modelMapper) {
    this.productRepository = productRepository;
    this.participantRepository = participantRepository;
    this.categoryRepository = categoryRepository;
    this.modelMapper = modelMapper;
  }

  // ModelMapper cannot infer List<Category> → List<Long> (name + type mismatch)
  // or Participant → Long, so we fill those two fields manually after auto-mapping.
  private ProductDTO toDto(Product product) {
    ProductDTO dto = modelMapper.map(product, ProductDTO.class);
    if (product.getCategories() != null) {
      dto.setCategoryIds(product.getCategories().stream()
              .map(Category::getId)
              .collect(Collectors.toList()));
    }
    if (product.getSeller() != null) {
      dto.setSellerId(product.getSeller().getId());
    }
    return dto;
  }

  @Override
  public List<ProductDTO> findAll(){
    List<Product> products = new LinkedList<>();
    productRepository.findAll(Sort.by("name")
    ).iterator().forEachRemaining(products::add);

    return products.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
  }

  @Override
  public ProductDTO findById(Long id) {
    Optional<Product> productOptional = productRepository.findById(id);
    if (!productOptional.isPresent()) {
      throw new RuntimeException("Product not found!");
    }
    return toDto(productOptional.get());
  }

  @Override
  public ProductDTO save(ProductDTO productDTO) {
    Product product = modelMapper.map(productDTO, Product.class);

    if (productDTO.getSellerId() != null) {
      participantRepository.findById(productDTO.getSellerId())
              .ifPresent(product::setSeller);
    }

    if (productDTO.getCategoryIds() != null) {
      List<Category> categories = (List<Category>) categoryRepository
              .findAllById(productDTO.getCategoryIds());
      product.setCategories(categories);
    }

    Product savedProduct = productRepository.save(product);
    return toDto(savedProduct);
  }

  @Override
  public void deleteById(Long id) {
    productRepository.deleteById(id);
  }

  @Override
  public void savePhotoFile(ProductDTO productDTO, MultipartFile file) {
    try {
      Product product = productRepository.findById(productDTO.getId())
              .orElseThrow(() -> new RuntimeException("Product not found!"));

      byte[] photoBytes = file.getBytes();

      Info info = product.getInfo();
      if (info == null) {
        info = new Info();
        info.setProduct(product);
        product.setInfo(info);
      }

      if (photoBytes.length > 0) {
        info.setPhoto(photoBytes);
      }

      productRepository.save(product);
    } catch (IOException e) {
      log.error("Error saving photo file: {}", e.getMessage());
    }
  }
}
```

#### Step 7
Add the interface and the implementation for CategoryService.

```java
public interface CategoryService {
    List<CategoryDTO> findAll();
    CategoryDTO findById(Long l);
    CategoryDTO save(CategoryDTO category);
    void deleteById(Long id);

}
```

```java
@Service
public class CategoryServiceImpl implements CategoryService{

  private CategoryRepository categoryRepository;
  private CategoryMapper categoryMapper;

  CategoryServiceImpl(CategoryRepository categoryRepository, CategoryMapper categoryMapper){
    this.categoryRepository = categoryRepository;
    this.categoryMapper = categoryMapper;
  }

  @Override
  public List<CategoryDTO> findAll(){
    List<Category> categories = new LinkedList<>();
    categoryRepository.findAll().iterator().forEachRemaining(categories::add);

    return categories.stream()
            .map(categoryMapper::toDto)
            .collect(Collectors.toList());
  }

  @Override
  public CategoryDTO findById(Long l) {
    Optional<Category> categoryOptional = categoryRepository.findById(l);
    if (!categoryOptional.isPresent()) {
      throw new RuntimeException("Category not found!");
    }

    return categoryMapper.toDto(categoryOptional.get());
  }

  @Override
  public CategoryDTO save(CategoryDTO categoryDto) {
    Category savedCategory = categoryRepository.save(categoryMapper.toCategory(categoryDto));
    return categoryMapper.toDto(savedCategory);
  }

  @Override
  public void deleteById(Long id) {
    categoryRepository.deleteById(id);
  }


}

```

#### Step 8
Add a test for CategoryService

```java
@ExtendWith(MockitoExtension.class)
public class CategoryServiceTest {

  @Mock
  CategoryMapper categoryMapper;
  @Mock
  CategoryRepository categoryRepository;

  @InjectMocks
  CategoryServiceImpl categoryService;

  @Test
  public void findProducts() {
    List<Category> categoryList = new ArrayList<>();
    Category category = new Category();
    categoryList.add(category);

    when(categoryRepository.findAll()).thenReturn(categoryList);
    List<CategoryDTO> categoriesDto = categoryService.findAll();
    assertEquals(1, categoriesDto.size());
    verify(categoryRepository, times(1)).findAll();
  }
}
```


#### Spring MVC

Spring MVC framework is designed around a central Servlet: **DispatcherServlet** that dispatches requests to controllers.
**WebApplicationContext** contains:
- **HandlerMapping**: maps incoming requests to handlers. The most common implementation is 	based on annotated Controllers
- **HandlerExceptionResolver**: maps exceptions to views.
- **ViewResolver**: resolves string-based view names based on view types.

![External Image](https://bafybeiajdnogimsw23jrtdpjlfv4ftnf3tvqemfzjrs3lzah2nwumbyjma.ipfs.w3s.link/mvc.png)


Spring MVC supports a variety of view technologies, such as:
- JSP (JavaServer Pages): A classic technology for creating dynamic web pages with embedded Java code.
- Thymeleaf: A modern server-side Java template engine that emphasizes natural HTML.
- FreeMarker: Another powerful and flexible template engine.
- Velocity: A simple and elegant template engine.


The configuration of a ViewResolver specifies:

- which view technology to use.
- how to locate the view files.


#### Thymeleaf

We will use a Gradle dependency for Thymeleaf.
Spring Boot will autoconfigure a ViewResolver based on configuration
we provide for specific technologies, i.e. for a specific Template Engine.
A ViewResolver provides a mapping between view names and actual views.

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
}
```

#### WebJars
WebJars simplify the process of managing and including client-side web libraries like JavaScript and CSS  in Java.
WebJars allows the declaration of libraries as dependencies
in build configuration files (such as Maven or Gradle).
When the project is built, web-jar dependencies are fetched automatically from a Maven repository and included in the project's classpath.

```groovy
dependencies {
    implementation 'org.webjars:webjars-locator:0.52'
    implementation 'org.webjars:bootstrap:5.3.3'
    implementation 'org.webjars:jquery:3.7.1'
    implementation 'org.webjars:font-awesome:6.5.2'
}
```

### Controllers and Views

- **Model**  acts as a container for application data
  intended for display in the user interface (the view). It essentially holds the attributes necessary for rendering dynamic web pages.

Methods within Spring MVC controllers, specifically those annotated with @RequestMapping, can
accept an argument of type Model.
This provides a convenient way to pass data from the controller
to the view.

Data is added to the Model using a map-like structure via the
_addAttribute_(String name, Object value)
method.
Here, name serves as the key
under which the value (the data object)
will be accessible within the view
(e.g., in JSP or Thymeleaf template).
Spring MVC then makes this Model object
available to the configured
view resolver and ultimately
to the chosen view technology
for rendering the response to the client.

- **ModelAndView** stores both the model and the view template that will be used
  by the TemplateEngine to render the response delivered to the client.
  Model attributes are store as a map and added with addObject.


#### Step 9
Add a new controller, ProductController. This controller will serve views interacting
with resources of type Product.


```java 	
@Controller
@RequestMapping("/products")
public class ProductController {
  ProductService productService;

  public ProductController(ProductService productService) {
    this.productService = productService;
  }

  @RequestMapping("")
  public String productList() {
    return "productList";
  }

}
```


### Thymeleaf Iterations
Thymeleaf is a Java template engine for processing HTML, XML, CSS etc.

Model attributes from Spring are available in Thymeleaf as “context variables”.
Context variables are accessed with Spring EL expressions.
Spring Expression Language is a language for query and manipulate object graph at runtime.

Model Attributes are accessed with:
${attributeName}

Request parameters are accessed with the syntax:
```
${param.param_name}
```

**th:each** iterates collections (java.util.Map, java.util.Arrays, java.util.Iterable etc.)

```
<tr th:each="product : ${products}"> 
```

The following properties may be accessed via status variable:
- index (iteration index, starting from 0)
- count (total number of elements processed)
- size (total number of elements)
- even/odd boolean
- first (boolean – true if current element is the first element of the collection), last (boolean true if current element is the last element of the collection)

```
<tr th:each="product, stat : ${products}"
    th:class="${stat.odd}? 'table-light':'table-dark'">
```


#### Step 10
Add Thymeleaf tags in productList.html view.


```html
<tr th:each="product, stat : ${products}"
    th:class="${stat.odd}? 'table-light':''">
  <td th:text="${product.id}">1</td>
  <td th:text="${product.name}">Product 1</td>
  <td th:text="${product.code}">Code</td>
  <td th:text="${product.reservePrice}">Reserved price</td>
  <td th:text="${product.reservePrice}">Best offer</td>
  <td><a href="#" th:href="@{'/products/edit/' + ${product.id}}"><i class="fa-solid fa-pen"></i></a></td>
  <td><a href="#" th:href="@{'/products/delete/' + ${product.id}}"><i class="fa-solid fa-trash"></i></a></td>
</tr>
```

#### Step 11
Update the ProductController to depend on the ProductService for retrieving product data. Pass the retrieved list of products to the view by adding it to the Model argument of the @RequestMapping handler method.

```java 
@Controller
@RequestMapping("/products")
public class ProductController {
    ProductService productService;
    CategoryService categoryService;
    
    public ProductController(ProductService productService, CategoryService categoryService) {
        this.productService = productService;
        this.categoryService = categoryService;
    }

    @RequestMapping("")
    public String productList(Model model) {
        List<ProductDTO> products = productService.findAll();
        model.addAttribute("products", products);
        return "productList";
    }
}
```

#### Step 12
Create a similar template for categories.

#### Step 13

Implement edit and delete
functionality in the
ProductController
with corresponding
endpoints
at /edit/{productId}
and /delete/{productId}.
Additionally, fetch all
categories and
inject this list
into the Model
specifically
for rendering the
product details view.

```java 
@RequestMapping("/edit/{id}")
public String edit(@PathVariable String id, Model model) {
    model.addAttribute("product", productService.findById(Long.valueOf(id)));
    
    List<CategoryDTO> categoriesAll = categoryService.findAll();
    model.addAttribute("categoriesAll", categoriesAll );

        return "productForm";
}


@RequestMapping("/form")
public String productForm(Model model) {
  ProductDTO product = new ProductDTO();
  model.addAttribute("product",  product);
  List<CategoryDTO> categoriesAll = categoryService.findAll();
  model.addAttribute("categoriesAll", categoriesAll );
  return "productForm";
}
```

The corresponding hidden fields in `productForm.html` must match the flat DTO shape:

```html
<form enctype="multipart/form-data" method="post" th:action="@{/products}" th:object="${product}">
    <input th:field="*{id}" type="hidden"/>
    <input th:field="*{info.id}" type="hidden"/>
    <input th:field="*{sellerId}" type="hidden"/>
```

And the category checkboxes bind to `categoryIds` (a `List<Long>`) rather than a `List<Category>`.

```html
<input th:field="*{categoryIds}"
       th:value="${category.id}"
       type="checkbox"/>
<label th:for="${#ids.prev('categoryIds')}"
       th:text="${category.name}">
</label>
```

```java 
@RequestMapping("/delete/{id}")
public String deleteById(@PathVariable String id){
  productService.deleteById(Long.valueOf(id));
  return "redirect:/products";
}
```

#### Step 14
Add method to handle file transfer to correctly update the image
associated with the product.
In ProductService add:

```java 
@Override
public void savePhotoFile(ProductDTO productDTO, MultipartFile file) {
    try {
        // load the existing product to avoid overwriting fields not present in the DTO
        Product product = productRepository.findById(productDTO.getId())
                .orElseThrow(() -> new RuntimeException("Product not found!"));

        byte[] photoBytes = file.getBytes(); 

        Info info = product.getInfo();
        if (info == null) {
            info = new Info();
            info.setProduct(product);
            product.setInfo(info);
        }

        if (photoBytes.length > 0) {
            info.setPhoto(photoBytes);
        }

        productRepository.save(product);
    } catch (IOException e) {
        log.error("Error saving photo file: {}", e.getMessage());
    }
}
```

In ProductController add:

```java 
@PostMapping("")
public String saveOrUpdate(@ModelAttribute ProductDTO product,
                               @RequestParam("imagefile") MultipartFile file){
    if (file.isEmpty())
        productService.save(product);
    else
        productService.savePhotoFile(product, file);


    return "redirect:/products" ;
}

```

```java 
@GetMapping("/getimage/{id}")
public void downloadImage(@PathVariable String id, HttpServletResponse response) throws IOException {
    ProductDTO productDTO = productService.findById(Long.valueOf(id));

    if (productDTO.getInfo() != null && productDTO.getInfo().getPhoto() != null) {
        byte[] photo = productDTO.getInfo().getPhoto();
        response.setContentType("image/jpeg");
        try (InputStream is = new ByteArrayInputStream(photo)) {
            StreamUtils.copy(is, response.getOutputStream());
        }
    }
}
```

#### Step 15
Add the controller for Categories:
```java 
@Controller
@RequestMapping("/categories")
public class CategoryController {
    CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @RequestMapping("")
    public String categoryList(Model model) {
        List<CategoryDTO> categories = categoryService.findAll();
        model.addAttribute("categories",categories);
        return "categoryList";
    }

}
```

### Tests
#### Argument captor

ArgumentCaptor is used to capture an argument which is passed
in the invocation of a method.
The constructor takes as argument
the type of the argument to be "captured".

Instead of using the ArgumentCaptor(type) constructor,
we can inject an ArgumentCaptor object with annotation @Captor

After invoking the method, captor.getValue() returns the value of the argument.

#### MockMVC
MockMvc object encapsulates web application beans
and allows testing web requests.
Available options are:

- Specifying headers for the request.
- Specifying request body.
- Validate the response:
  - check HTTP - status code,
  - check response headers,
  - check response body.

When running an integration test different layers of
applications are involved. @AutoConfigureMockMvc
annotation instructs Spring to create a MockMvc object,
associated with the application context,
prepared to send requests to TestDispatcherServlet
which is an extension of DispatcherServlet.  
Requests are sent by calling the perform method.
If @AutoConfigureMockMvc annotation is used,
MockMvc object can be injected with @Autowired annotation.

**@SpringBootTest** bootstraps the entire
Spring container.
Values for webEnvironment property of @SpringBootTest
annotation are:
- **RANDOM_PORT**: EmbeddedWebApplicationContext, real servlet environment.
  Embedded servlet containers are started and listening on a random port.

- **DEFINED_PORT**: EmbeddedWebApplicationContext, real servlet environment. 			Embedded servlet containers are started and listening on a defined port (i.e. from  			application.properties or on the default port 8080).

- **NONE**: loads ApplicationContext using SpringApplication,
  does not provide any servlet environment.

#### Extensions
**Junit 5 extensions** extends the behavior
of test class or methods.
Extensions are related to a certain event
in the execution of a test (extension point).
For each extension point we implement an interface.
@ExtendWith annotation registers test extensions.

**MockitoExtension.class** finds member
variables annotated with **@Mock** and creates
a mock implementation of those variables.
Mocks are injected into member variables
annotated with the **@InjectMocks** annotation,
using either construction injection or setter injection.

**@MockitoBean** adds mock objects to Spring application
context. The mock will replace any existing bean of
the same type in the application context.

#### Step 16

Add a new test class _ProductServiceControllerTest_.

```java
@ExtendWith(MockitoExtension.class)
public class ProductServiceControllerTest {

  @Mock
  Model model;
  
  @Mock
  ProductService productService;
  
  @InjectMocks
  ProductController productController;

  @Mock
  CategoryService categoryService;
}
```

#### Step 17
Add a new test _showById_.

```java
@Test
public void showById() {
  Long id = 1L;
  Product productTest;

  productTest = new Product();
  productTest.setId(id);

  ProductDTO productTestDTO = new ProductDTO();
  productTestDTO.setId(id);

  when(productService.findById(id)).thenReturn(productTestDTO);

  String viewName = productController.edit(id.toString(), model);
  assertEquals("productForm", viewName);
  verify(productService, times(1)).findById(id);

  ArgumentCaptor<ProductDTO> argumentCaptor = ArgumentCaptor.forClass(ProductDTO.class);
  verify(model, times(1))
          .addAttribute(eq("product"), argumentCaptor.capture() );

  ProductDTO productArg = argumentCaptor.getValue();
  assertEquals(productArg.getId(), productTestDTO.getId() );

}
```

#### Step 18
Add Mocks for productService and
for Model in a test class
ProductServiceControllerTest

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")  // consistent with existing repo tests; use "mysql" only if a MySQL container is available
public class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    ProductService productService;

    @MockitoBean
    CategoryService categoryService;

    @MockitoBean
    Model model;
}
```

#### Step 19
Set the behavior of the productService in _showByIdMvc()_ test.

```java
    @Test
public void showByIdMvc() throws Exception {
  Long id = 1L;

  ProductDTO productTestDTO = new ProductDTO();
  productTestDTO.setId(id);
  productTestDTO.setName("test");

  when(productService.findById(id)).thenReturn(productTestDTO);

  mockMvc.perform(get("/products/edit/{id}", "1"))
          .andExpect(status().isOk())
          .andExpect(view().name("productForm"))
          .andExpect(model().attribute("product", productTestDTO));

}
```

#### Step 20
Add a test for POST request.

```java
    @Test
public void testSaveOrUpdate_WithValidProductAndNoFile_ShouldSaveProduct() throws Exception {
    ProductDTO product = new ProductDTO();
    product.setName("Test Product");

    mockMvc.perform(MockMvcRequestBuilders.multipart("/products").file("imagefile", new byte[0])
                  .param("name", "Test Product")
                  .contentType(MediaType.MULTIPART_FORM_DATA)
                  .accept(MediaType.TEXT_HTML))
          .andExpect(status().is3xxRedirection())
          .andExpect(redirectedUrl("/products"));

    ArgumentCaptor<ProductDTO> argumentCaptor = ArgumentCaptor.forClass(ProductDTO.class);
    verify(productService, times(1))
          .save(argumentCaptor.capture() );

    ProductDTO productArg = argumentCaptor.getValue();
    assertEquals(productArg.getName(), product.getName() );
}
```



### Docs

[1] https://docs.spring.io/spring-framework/reference/web/webmvc.html

[2] https://www.baeldung.com/spring-template-engines

[3] https://www.baeldung.com/maven-webjars

[4] https://www.baeldung.com/spring-mvc-model-model-map-model-view

[5] https://www.baeldung.com/entity-to-and-from-dto-for-a-java-spring-application

[6] https://www.baeldung.com/java-performance-mapping-frameworks
