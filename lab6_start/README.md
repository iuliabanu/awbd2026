
# Project 6

This project contains examples of Spring Security tests, validations and error handling.
- add security tests for Controllers with role-based access control.
- examples of using HandlerExceptionResolver.
- validate forms with Bean Validation API.

### Security Tests

Spring Security provides comprehensive testing support for both method-level security 
and web-based security. The `@WithMockUser` annotation allows you to run tests 
as a specific user with defined roles and authorities.

#### MockMVC for Security Testing

MockMvc object encapsulates web application beans 
and allows testing web requests with security constraints. 
Available options are:

- Specifying headers for the request.
- Specifying request body.
- Testing authentication and authorization.
- Validate the response:
  - check HTTP status code (200, 403 Forbidden, 401 Unauthorized), 
  - check response headers, 
  - check response body,
  - verify redirects to login page.

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
Spring container with security configuration enabled. 
Values for webEnvironment property of @SpringBootTest 
annotation are:
- **RANDOM_PORT**: EmbeddedWebApplicationContext, real servlet environment. 
		Embedded servlet containers are started and listening on a random port.

- **DEFINED_PORT**: EmbeddedWebApplicationContext, real servlet environment. 			Embedded servlet containers are started and listening on a defined port (i.e from  			application.properties or on the default port 8080).

- **NONE**: loads ApplicationContext using SpringApplication, 
does not provide any servlet environment.

#### @WithMockUser

The **@WithMockUser** annotation creates a mock user 
for testing purposes. You can specify:
- **username**: the username of the mock user
- **password**: the password (not actually validated during tests)
- **roles**: the roles assigned to the user (e.g., "ADMIN", "GUEST")
- **authorities**: specific authorities/permissions

#### Spring Security Test Dependency

Add the following dependency to your build.gradle:

```gradle
testImplementation 'org.springframework.security:spring-security-test'
```

#### Step 1

Create a test class for Product Controller with security configuration.

```java
@SpringBootTest
@AutoConfigureMockMvc
public class ProductControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    ProductService productService;
}
```

**Required imports**:
```java
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
```

#### Step 2
Test that unauthenticated users are redirected to login page when accessing protected resources.

```java
@Test
public void testAccessProductListWithoutAuthentication() throws Exception {
    mockMvc.perform(get("/products"))
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrlPattern("**/login"));
}
```

#### Step 3
Test that GUEST role can view products but gets forbidden when trying to create new products.

```java
@Test
@WithMockUser(username = "guest", roles = "GUEST")
public void testGuestCanViewProducts() throws Exception {
    mockMvc.perform(get("/products"))
            .andExpect(status().isOk())
            .andExpect(view().name("productList"));
}

@Test
@WithMockUser(username = "guest", roles = "GUEST")
public void testGuestCannotAccessProductForm() throws Exception {
    mockMvc.perform(get("/products/form"))
            .andExpect(status().isForbidden());
}
```

#### Step 4
Test that ADMIN role has full access to all product operations.

```java
@Test
@WithMockUser(username = "admin", roles = "ADMIN")
public void testAdminCanAccessProductForm() throws Exception {
    mockMvc.perform(get("/products/form"))
            .andExpect(status().isOk())
            .andExpect(view().name("productForm"))
            .andExpect(model().attributeExists("product"));
}

@Test
@WithMockUser(username = "admin", roles = "ADMIN")
public void testAdminCanEditProduct() throws Exception {
    Long id = 1L;
    ProductDTO productDTO = new ProductDTO();
    productDTO.setId(id);
    productDTO.setName("Test Product");
    
    when(productService.findById(id)).thenReturn(productDTO);
    
    mockMvc.perform(get("/products/edit/{id}", id))
            .andExpect(status().isOk())
            .andExpect(view().name("productForm"))
            .andExpect(model().attribute("product", productDTO));
}
```

#### Step 5
Test POST operations with CSRF token and role-based access.

```java
@Test
@WithMockUser(username = "admin", roles = "ADMIN")
public void testAdminCanSaveProduct() throws Exception {
    mockMvc.perform(post("/products")
                    .with(csrf())
                    .param("name", "New Product")
                    .param("code", "PROD001")
                    .param("reservePrice", "150.00")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED))
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl("/products"));
}

@Test
@WithMockUser(username = "guest", roles = "GUEST")
public void testGuestCannotSaveProduct() throws Exception {
    mockMvc.perform(post("/products")
                    .with(csrf())
                    .param("name", "New Product")
                    .param("code", "PROD001")
                    .param("reservePrice", "150.00")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED))
            .andExpect(status().isForbidden());
}
```

**Note**: Requires static imports:
```java
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
```

#### Step 6
Test DELETE operations with role restrictions.

```java
@Test
@WithMockUser(username = "admin", roles = "ADMIN")
public void testAdminCanDeleteProduct() throws Exception {
    Long id = 1L;
    
    mockMvc.perform(get("/products/delete/{id}", id)
                    .with(csrf()))
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl("/products"));
            
    verify(productService, times(1)).deleteById(id);
}

@Test
@WithMockUser(username = "guest", roles = "GUEST")
public void testGuestCannotDeleteProduct() throws Exception {
    Long id = 1L;
    
    mockMvc.perform(get("/products/delete/{id}", id))
            .andExpect(status().isForbidden());
            
    verify(productService, never()).deleteById(id);
}
```

#### Step 7
Test access denied page is displayed when authorization fails.

```java
@Test
@WithMockUser(username = "guest", roles = "GUEST")
public void testAccessDeniedPageForForbiddenResource() throws Exception {
    mockMvc.perform(get("/products/form"))
            .andExpect(status().isForbidden())
            .andExpect(forwardedUrl("/access_denied"));
}
```

#### Step 8
Test with multiple roles and custom authorities.

```java
@Test
@WithMockUser(username = "moderator", roles = {"GUEST", "MODERATOR"})
public void testUserWithMultipleRoles() throws Exception {
    mockMvc.perform(get("/products"))
            .andExpect(status().isOk());
}

@Test
@WithMockUser(username = "user", authorities = {"ROLE_ADMIN", "WRITE_PRIVILEGE"})
public void testUserWithCustomAuthorities() throws Exception {
    mockMvc.perform(get("/products/form"))
            .andExpect(status().isOk());
}
```

### Exception handling
#### HandlerExceptionResolver

HandlerExceptionResolver is used internally by Spring 
to intercept and process any exception raised in the MVC 
system and not handled by a Controller. The handler parameter 
refers to the controller that generated the exception.

```java
public interface HandlerExceptionResolver {
    ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex);
}
```

Three default implementations are created for 
HandlerExceptionResolver and processed in order 
by the HandlerExceptionResolverComposite bean.

**HandlerExceptionResolver Implementations:**
1. **ExceptionHandlerExceptionResolver**: Handles exceptions through @ExceptionHandler methods
2. **ResponseStatusExceptionResolver**: Handles exceptions annotated with @ResponseStatus
3. **DefaultHandlerExceptionResolver**: Handles standard Spring MVC exceptions

<!-- External Diagram: Exception Handler Resolution Chain -->
![Exception Handling Flow](https://bafybeibmb5nwkiojpumpdtgmpkz6pkttde4jzbxqtx5qdvjqp6knpvijhm.ipfs.w3s.link/execptions.jpg)

##### @ResponseStatus

@ResponseStatus annotates a custom exception class 
to indicate the HTTP status to be returned 
when the exception is thrown. 
Examples of status codes:
- **400 Bad Request**: Client sent an invalid request.
- **401 Unauthorized**: Authentication required.
- **403 Forbidden**: Authenticated but not authorized to access resource.  
- **404 Not Found**: Resource not found. 
- **405 Method Not Allowed**: HTTP method not supported for this endpoint.
- **500 Internal Server Error**: Unhandled server exceptions.

##### @ExceptionHandler 

@ExceptionHandler defines custom exception handling 
at the Controller level:
- define a specific status code. 
- return a specific view with details about the error. 
- interact with ModelAndView objects. 
- within an @ExceptionHandler method, we don't have direct 
access to the Model object. We can't directly add attributes 
to the model.

##### SimpleMappingExceptionResolver 
- Maps exception class names to view names.
- Specifies a fallback error page for exceptions not associated with a specific view.
- Adds exception attributes to the model for rendering error details.

#### Step 9
Create a new package com.awbd.lab6.exceptions and 
a custom exception class that will be thrown if a product 
id is not found in the database. 

```java
public class ResourceNotFoundException extends RuntimeException {
  public ResourceNotFoundException() {
  }

  public ResourceNotFoundException(String message) {
    super(message);
  }

  public ResourceNotFoundException(String message, Throwable throwable) {
    super(message, throwable);
  }
}
```

#### Step 10
Throw a ResourceNotFoundException error when 
the product id is not found in the database. 
Modify method findById in ProductService.
Test http://localhost:8080/products/edit/10

```java
@Override
public ProductDTO findById(Long l) {
    Optional<Product> productOptional = productRepository.findById(l);
    if (productOptional.isEmpty()) {
        throw new ResourceNotFoundException("product " + l + " not found");
    }
    return modelMapper.map(productOptional.get(), ProductDTO.class);
}
```

Alternatively, using Optional.orElseThrow():
```java
@Override
public ProductDTO findById(Long l) {
    Product product = productRepository.findById(l)
        .orElseThrow(() -> new ResourceNotFoundException("product " + l + " not found"));
    return modelMapper.map(product, ProductDTO.class);
}
```

#### Step 11
Annotate ResourceNotFoundException with @ResponseStatus.

```java
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
  // ...existing code...
}
```

#### Step 12
Add an @ExceptionHandler method for 
ResourceNotFoundException.class in ProductController.

```java
@ExceptionHandler(ResourceNotFoundException.class)
public ModelAndView handlerNotFoundException(Exception exception){
    ModelAndView modelAndView = new ModelAndView();
    modelAndView.getModel().put("exception",exception);
    modelAndView.setViewName("notFoundException");
    return modelAndView;
}
```

#### Step 13
Add a test setting the productService to throw ResourceNotFoundException.

```java
@Test
@WithMockUser(username = "admin", password = "12345", roles = "ADMIN")
public void showByIdNotFound() throws Exception {
    Long id = 1l;

    when(productService.findById(id)).thenThrow(ResourceNotFoundException.class);

    mockMvc.perform(get("/products/edit/{id}", "1"))
            .andExpect(status().isNotFound())
            .andExpect(view().name("notFoundException"))
            .andExpect(model().attributeExists("exception"));
}
```

#### Step 14
Annotate handlerNotFoundException method with @ResponseStatus(HttpStatus.NOT_FOUND). 
Re-run tests.

```java
@ResponseStatus(HttpStatus.NOT_FOUND)
@ExceptionHandler(ResourceNotFoundException.class)
public ModelAndView handlerNotFoundException(Exception exception){
    ModelAndView modelAndView = new ModelAndView();
    modelAndView.getModel().put("exception",exception);
    modelAndView.setViewName("notFoundException");
    return modelAndView;
}
```

#### Step 15
Add a @ControllerAdvice class which will handle Exceptions globally, for all controllers.

```java
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ModelAndView handlerNotFoundException(Exception exception){
        ModelAndView modelAndView = new ModelAndView();
        modelAndView.getModel().put("exception",exception);
        modelAndView.setViewName("notFoundException");
        return modelAndView;
    }

}
```

#### Step 16
Test http://localhost:8080/products/edit/abc
Create a SimpleMappingExceptionResolver bean 
that will map NumberFormatException to a default view, 
_defaultException.html_.


```java
@Configuration
public class MvcConfiguration implements WebMvcConfigurer {

    @Bean(name = "simpleMappingExceptionResolver")
    public SimpleMappingExceptionResolver
    getSimpleMappingExceptionResolver() {
        SimpleMappingExceptionResolver r =
                new SimpleMappingExceptionResolver();

        r.setDefaultErrorView("defaultException");
        r.setExceptionAttribute("ex");     // default "exception"

        return r;
    }
}
```

#### Step 17
Add mapping for specific Exceptions, setting the views and the Status Codes. 

```java
SimpleMappingExceptionResolver r =
        new SimpleMappingExceptionResolver();
//...
Properties mappings = new Properties();
mappings.setProperty("NumberFormatException", "numberFormatException");
r.setExceptionMappings(mappings);

Properties statusCodes = new Properties();
statusCodes.setProperty("NumberFormatException", "400");
r.setStatusCodes(statusCodes);
```

### Validation API

The Java Bean Validation API from Hibernate 
allows you to express and validate application 
constraints, ensuring that beans meet specific criteria.

Examples of annotations:
- **@Size**: specifies field length. 
- **@Min @Max**: specifies minimum and maximum values for numeric fields.
- **@Pattern**: validates field against a regular expression. 
- **@NotNull**: ensures that the field is not null.
- **@NotEmpty**: ensures that the field is not null and not empty.
- **@Email**: validates that the field is a valid email address.

build.gradle dependencies (included in spring-boot-starter-validation):
```gradle
implementation 'org.springframework.boot:spring-boot-starter-validation'
```

This starter includes:
- hibernate-validator
- jakarta.validation-api
- hibernate-validator-annotation-processor

#### Step 18
Add annotations to ensure that the minimum price 
for a product is 100. 
Check that the product name contains only letters.

```java
@Setter
@Getter
@Entity
public class Product {

    //...
    
    @NotEmpty(message = "Product name is required")
    @Pattern(regexp = "[A-Za-z\\s]+", message = "Product name should contain only letters")
    private String name;

    @Min(value = 100, message = "Minimum price should be 100")
    private Double reservePrice;
    
    //...
}
```

#### Step 19
Add annotations to ensure that the product code 
contains only capital letters and is not empty.

```java
@Setter
@Getter
@Entity
public class Product {

    //...
    
    @NotEmpty(message = "Product code is required")
    @Pattern(regexp = "[A-Z]+", message = "Product code should contain only capital letters")
    private String code;

    @Min(value = 100, message = "Minimum price should be 100")
    private Double reservePrice;
    
    //...
}
```

#### Step 20
Add validation for category name with size constraints.

```java
@Setter
@Getter
@Entity
public class Category {

    //...
    
    @NotEmpty(message = "Category name is required")
    @Size(min = 3, max = 50, message = "Category name must be between 3 and 50 characters")
    private String name;
    
    //...
}
```

#### Step 21
Return the form if it has errors. Change saveOrUpdate method in ProductController.

```java
@PostMapping("")
public String saveOrUpdate(@Valid @ModelAttribute ProductDTO product,
                            BindingResult bindingResult,
                            @RequestParam("imagefile") MultipartFile file
){
    if (bindingResult.hasErrors()) {
        bindingResult.getAllErrors().forEach(error -> {
            System.out.println(error.getDefaultMessage());
        });
        return "productForm";
    }
    //...
}
```

### Docs

[1] https://www.baeldung.com/mockito-argumentcaptor

[2] https://www.baeldung.com/mockito-argumentcaptor
 
[3] https://spring.io/guides/gs/testing-web/

[4] https://www.baeldung.com/integration-testing-in-spring

[5] https://www.baeldung.com/spring-boot-testing

[6] https://docs.spring.io/spring-boot/docs/1.5.3.RELEASE/reference/html/boot-features-testing.html

[7] https://www.baeldung.com/java-spring-mockito-mock-mockbean

[8] https://www.baeldung.com/spring-response-status

[9] https://spring.io/blog/2013/11/01/exception-handling-in-spring-mvc

[10] http://hibernate.org/validator/

[11] https://www.baeldung.com/javax-validation

[12] https://www.infoworld.com/article/3543268/junit-5-tutorial-part-2-unit-testing-spring-mvc-with-junit-5.html

[13]  https://www.baeldung.com/junit-5-extensions





