
# Project 2

This project include examples of using JPA (Java Persistence API):

- working with an embedded
  in-memory database, H2, or with a relational MySQL database.
- creating entities and relationships.
- managing entities' lifecycle.
- running tests, working with @DataJpaTest.

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

### Lombok annotations

Lombok generates code
that is commonly used
in Java plain objects, like setters, getters, constructors, toString, equals or hashCode functions or logging options.
It reduces boilerplate code and may be easily integrated in IDEs. With Lombok plugins that support Lombok features, the generated code is automatically and immediately available.
In IntelliJ, you may find the Lombok plugin under Refactor menu.

#### Step 1
Annotate all classes with Lombok.Data. @Data has the same effect as adding: @EqualsAndHashCode, @Getter, @Setter, @ToString. It also adds a constructor taking as arguments all @NonNull and final fields.
Try "Refactor – DeLombok" to see the equivalent Java Code.


```java
@Data
public class Category {

    private Long id;
    private String name;

    private List<Product> products;

}
```

### H2 database configuration

H2 in-memory RDBMS (relational database management system), can be embedded in Java Applications. It supports standard SQL and JDBC API.  
In-memory databases rely on main memory for data storage, in contrast to databases that store data on disk or SSDs, hence in-memory databases are faster than traditional RDBMS obtaining minimal response time by eliminating the need to access disks.
If maven dependency for H2 is added in pom.xml or in build.gradle Spring autoconfigures an H2 instance.

#### Step 2

Enable H2 database console and configure the data source in the application.properties file.
If H2 console is enabled, by setting the property spring.h2.console.enabled, we may access the url:
http://localhost:8080/h2-console

If property spring.datasource.url=jdbc:h2:mem:testdb is set, a database named testdb will be embedded in the application, notice also the properties to set up driver and credentials.



```
spring.h2.console.enabled=true
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
```

### Entities

**@Entity** JPA Entities are POJOs that can be persisted in the database. Each entity represents a table. Every instance of a class annotated with @Entity represents a row in the table.

**@Id**
All entities must have a primary key. The filed annotated with @Id represents the primary key.
For each primary key it is mandatory to define a generation strategy. There are four possible generation strategies:
- GenerationType.**AUTO**		Spring chooses strategy.
- GenerationType.**IDENTITY** 	auto-incremented value.
- GenerationType.**SEQUENCE**	uses a sequence if sequences are supported by the database (for example in Oracle databases).
- GenerationType.**TABLE**		uses a table to store generated values.

For the last two generation strategies we must specify a generator (sequence or table):
```java 	
@GeneratedValue(strategy = GenerationType.TABLE, generator = "table-generator")
@TableGenerator(name = "table-generator")
```

#### Step 3

Annotate all classes with @Entity. Also annotate key attributes with @Id and @GeneratedValue. Re-run the application and check that tables CATEGORY, PRODUCT, PARTICIPANT and INFO are created in the H2 database.

```java 	
@Data
@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String code;
    private Double reservePrice;
    private Boolean restored;
}

```

### Relationships

**@OneToOne** links two tables based on a FK column. In the child table a foreign key value references the primary key from a row in the parent table.
Each row in the child table is linked to exactly one row in the parent table, in other words, each instance of the child @Entity is linked to exactly one instance of the parent @Entity.

OneToOne relationships can be either unidirectional or bidirectional. 	
For instance, unidirectional relationship product – info means that the entity _Product_ will provide access to entity _Info_, but _Info_ entity we will not provide access to a product. In the associated tables in the RDBMS we will add info_id column in table product, but we will not add product_id column in table info.

**@OneToMany** specifies that one entity is associated with one or more entities. This type of relationship is modeled by List, Set, Map, SortedSet, SortedMap collections. The foreign key is added in the table corresponding to “many”. For instance, Participant-Product is a one-to-many relationship. The foreign key is added in the Product table.

**@ManyToOne** is pairing a relationship of type @OneToMany.

**@JoinColum** defines the foreign key.
In Product, we add:

```java 	
@ManyToOne
@JoinColumn(name="seller_id")
private Participant seller;
```

The attribute **mappedBy** defines the corresponding field in the corresponding Many-To-One relationship.
(@ManyToOne relationship) in Participant we have:

```java
@OneToMany(mappedBy = "participant")
private List<Product> products;
```

**@ManyToMany** is defined by an association table. For instance, the relationship product-category is modeled by the table product_category with columns: product_id, category_id.

**@JoinTable** defines the association table. In @Entity Category we have:

```java
@JoinTable(name = "product_category", 
        joinColumns = @JoinColumn(name = "category_id", referencedColumnName = "id"), 
        inverseJoinColumns = @JoinColumn(name = "product_id", referencedColumnName = "id"))
private List<Product> products;
```

The attribute mappedBy defines the corresponding field in the associated Many-To-Many relationship. 			(@ManyToMany relationship) in @Entity Product we have:
```java
@ManyToMany(mappedBy = "products")
private List<Category> categories;
```

#### Step 4
Add a @OnoToOne relationship between product and info entities.
In the entity Product add filed _info_.

```java
@OneToOne(mappedBy = "product")
private Info info;
```

In the entity Info add filed _product_.
```java
@OneToOne
private Product product;
```


Run the application and check that the columns product_id and info_id are added in the tables info and product.

#### Step 5
Add a @OneToMany and a @ManyToOne relationships between the entities Participant and Product.

In Participant add:

```java
@OneToMany(mappedBy = "seller")
private List<Product> products;
```

In Product add:
```java
@ManyToOne
private Participant seller;
```

Run the application. Check that the column seller_id is added in the table product.

#### Step 6
Add a @ManyToMany relationship Product-Category:

In Product add:
```java
@ManyToMany(mappedBy = "products")
private List<Category> categories;
```

In Category add:
```java
@ManyToMany
@JoinTable(name = "product_category",
        joinColumns =@JoinColumn(name="category_id",referencedColumnName = "id"),
        inverseJoinColumns =@JoinColumn(name="product_id",referencedColumnName="id"))
private List<Product> products;
```

Run the application and check the creation of table product_category.

### Enumerations
To allow more flexibility
and more readability,
string enums can replace
number enums.
We can also enrich the enum class
with a descriptor attribute.
String-based enums are more
resilient to changes
in the set of enum values over time.
If new enum values are added or
existing ones are modified,
string-based enums do not require
changes to the underlying database
schema. In contrast, integer-based
enums may require schema
modifications if enum values are
added or renumbered,
leading to potential data migration
issues.

#### Step 7

Change the definition of enum Currency.

```java
public enum Currency {
USD("USD $"), EUR("EUR"), GBP("GBP");

    private final String description;

    public String getDescription() {
        return description;
    }

    Currency(String description) {
        this.description = description;
    }
}
```

#### Step 8
Add @Enumerated annotation for attributes of type Currency. Alter the type of column .

```java
@Enumerated(value = EnumType.STRING)
private Currency currency;
```

### Database initialization

Hibernate options: For test purposes a file **import.sql** may be added in resources. The sql statements added in this file will be used to initialize the database.

**spring.jpa.hibernate.ddl-auto** specifies options for database initialization:
- **none**: applications start without database initialization
- **create**: tables are dropped and recreated at startup. A table is created for each class annotated with @Entity.
- **create-drop**: tables are created at startup and dropped when application stops. This is the default value for embedded databases.
- **validate**: application starts if all tables corresponding to entities exist and match entities specifications.
- **update**: Hibernates updates schema if tables differ from entities specifications.

Spring Boot options: The files
- schema-[platform].sql containing DDL statements and
- data-[platform].sql containing LMD statements

may be used to create and initialize the database.
The suffix platform is set by **spring.sql.init.platform**.
**spring.sql.init.mode** controls initialization behavior: always, never of embedded


#### Step 9
Test **spring.jpa.hibernate.ddl-auto**=create | create-drop and **import.sql**

Add the file import.sql. We will add data in tables: category, participant, product, product_category.

```sql
insert into category(id, name) values(1, 'paintings');
insert into participant(id, last_name, first_name) values(1, 'Adam', 'George');
insert into product (id, name, code, reserve_price, restored, seller_id) values (1, 'The Card Players', 'PCEZ', 250, 0, 1);
insert into product_category values(1,1);
```
Rename or delete the file import.sql. In the next steps we will use data.sql and schema.sql

#### Step 10
Reorganize application's properties in the following files:
- application.properties:
```
spring.profiles.active=h2
spring.jpa.show-sql=true
```
- **application-h2.properties**

```
spring.h2.console.enabled=true
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
```
- **application-mysql.properties**

```
spring.datasource.url=jdbc:mysql://localhost:3306/awbd
spring.datasource.username=awbd
spring.datasource.password=awbd
spring.jpa.hibernate.ddl-auto=create-drop
```

We may use a docker container for mysql:

```
docker pull mysql
docker run --name mysql_awbd -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=awbd -e MYSQL_PASSWORD=awbd -e MYSQL_USER=awbd -p 3306:3306  mysql
```
We may use two profiles: h2 and mysql.
Add different run-configurations for profiles h2 and mysql.
Run the application with profiles h2 and mysql.

#### Step 11
Test **spring.sql.init.mode** and **data-h2.sql, schema-h2.sql**.

Add the file schema-h2.sql. Rename the file import.sql -> data-h2.sql and test spring.sql.init.mode options.

```
#h2 profile
spring.jpa.hibernate.ddl-auto=none
spring.sql.init.mode = embedded
spring.sql.init.platform=h2

#mysql profile
spring.jpa.hibernate.ddl-auto=none
spring.sql.init.mode = always
spring.sql.init.platform=mysql
```

#### Step 12
We may use different initialization files.
Add files data-h2.sql, data-mysql, schema-h2, schema-mysql.

Add drop statements for mysql schema.

```
DROP TABLE IF EXISTS product_category;
DROP TABLE IF EXISTS info;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS participant;
```

Add in corresponding .properties files spring.sql.init.platform option.

```
spring.jpa.hibernate.ddl-auto=none
spring.sql.init.mode = embedded
spring.sql.init.platform=h2
```

```
#spring.jpa.hibernate.ddl-auto=create-drop

#spring.jpa.hibernate.ddl-auto=none
#spring.sql.init.mode = always
#spring.sql.init.platform=mysql

spring.jpa.hibernate.ddl-auto=validate
spring.sql.init.mode = never
```

To start the application without initializing the database use:
```
spring.jpa.hibernate.ddl-auto=validate
spring.sql.init.mode = never
```


## Factory design pattern

The Factory Design Pattern is a creational design pattern that provides a way to create objects without specifying their concrete classes. Instead of calling a constructor directly, a factory method is used to instantiate objects. This pattern promotes loose coupling and flexibility in object creation.

![External Image](https://bafybeibhleief3zvjkdvsc63om2b4k4y6bin4x4ulhkos6gvic5kdfpnle.ipfs.w3s.link/factorypattern.png)

In Spring and JPA (Java Persistence API), EntityManager is used to interact with the database. It provides methods for performing CRUD operations.


The EntityManagerFactory is a component in Java Persistence API (JPA) responsible for creating EntityManager instances based on persistence configuration. An EntityManager is used to interact with the database via a PersistenceContext.
Persistence context keeps track of all the changes made into managed entities.
There are two types of persistence contexts:
- Transaction-scoped persistence context (default): When a transaction completes all changes are flushed into persistent storage.
- Extended-scoped persistence context: An extended persistence context can span across multiple transactions. We can persist the entity without the transaction but cannot flush it without a transaction.

#### Step 13
Create a test class in a new package com.awbd.lab2.domain.
```java
@DataJpaTest
@ActiveProfiles("h2")
public class EntityManagerTest {

    @Autowired
    private EntityManager entityManager;

    @Test
    public void findProduct() {
        System.out.println(entityManager.getEntityManagerFactory());
        Product productFound = entityManager.find(Product.class, 1L);
        assertEquals("PCEZ", productFound.getCode());
    }
}
```

#### Step 14
Create a package com.awbd.lab2.services and two classes PersistenceContentExtended and PersistenceContextTransaction.

```java
@Service
public class PersistenceContextExtended {
    @PersistenceContext(type = PersistenceContextType.EXTENDED)
    private EntityManager entityManager;

    @Transactional
    public Participant updateInTransaction(Long participantId, String name) {
        Participant updatedParticipant = entityManager.find(Participant.class, participantId);
        updatedParticipant.setFirstName(name);
        entityManager.persist(updatedParticipant);
        return updatedParticipant;
    }
    public Participant update(Long participantId, String name) {
        Participant updatedParticipant = entityManager.find(Participant.class, participantId);
        updatedParticipant.setFirstName(name);
        entityManager.persist(updatedParticipant);
        return updatedParticipant;
    }
    public Participant find(long id) {

        return entityManager.find(Participant.class, id);
    }
}
```

```java
@Service
public class PersistenceContextTransaction {
    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public Participant updateInTransaction(Long participantId, String name) {
        Participant updatedParticipant = entityManager.find(Participant.class, participantId);
        updatedParticipant.setFirstName(name);
        entityManager.persist(updatedParticipant);
        return updatedParticipant;
    }

    public Participant update(Long participantId, String name) {
        Participant updatedParticipant = entityManager.find(Participant.class, participantId);
        updatedParticipant.setFirstName(name);
        entityManager.persist(updatedParticipant);
        return updatedParticipant;
    }

    public Participant find(long id) {
        return entityManager.find(Participant.class, id);
    }
}
```

#### Step 15

Add tests:

```java
@SpringBootTest(classes=com.awbd.lab2.Lab2Application.class )
@ActiveProfiles("h2")
public class PersistenceContextTest {

    @Autowired
    PersistenceContextExtended persistenceContextExtended;

    @Autowired
    PersistenceContextTransaction persistenceContextTransaction;

    @Test
    public void persistenceContextTransactionThrowException() {
        assertThrows(TransactionRequiredException.class,
                () -> persistenceContextTransaction.update(1L, "William"));
    }

    @Test
    public void persistenceContextTransactionInTransaction() {
        persistenceContextTransaction.updateInTransaction(1L, "William");
        Participant participantExtended = persistenceContextExtended.find(1L);
        System.out.println(participantExtended.getFirstName());
        assertEquals("William", participantExtended.getFirstName());
    }


    @Test
    public void persistenceContextExtendedNoTransaction() {
        persistenceContextExtended.update(1L, "Snow");
        Participant participantExtended = persistenceContextExtended.find(1L);
        System.out.println(participantExtended.getFirstName());
        assertEquals("Snow", participantExtended.getFirstName());
    }

    @Test
    public void persistenceContextExtendedInTransaction() {
        persistenceContextExtended.update(1L, "Will");
        Participant participantTransaction = persistenceContextTransaction.find(1L);
        System.out.println(participantTransaction.getFirstName());
        assertNotEquals("Will",participantTransaction.getFirstName());
    }

}

```

#### Step 16

Add actuator dependency in pom.xml and check the beans that are created in the application.

```		
<dependency>
    <groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-actuator</artifactId>
</dependency>


// Source: https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-starter-actuator
implementation("org.springframework.boot:spring-boot-starter-actuator:4.0.1")
```
### Configure Git Copilot agent to generate code for MVC architecture.

#### Step 17 

Add the following instructions in the .github/agents/jpa_entity_generator.agent.mdfile:
Basic instructions are also available in the code generation agent template, 
and the complete template is available in the [repository](./jpa_entity_generator.agent.md).


```markdown
---
name: jpa entity validator
description: Generates AND validates JPA @Entity classes with relationships from Mermaid ERD diagrams. Validates existing entities against the diagram, detecting missing relationships, incorrect mappings, or inconsistencies. Use for both new generation and validation of existing code.
argument-hint: Path to Mermaid ERD file or validation request (e.g., "generate entities from schema.md", "validate existing entities against schema.md", "check domain package consistency")
tools: ['read_file', 'insert_edit_into_file', 'create_file', 'list_dir','file_search']
---
You are an JPA Entity Generator and Validator that helps backend developers convert Mermaid ERD diagrams into properly annotated Java entity classes AND by validating existing entities against the diagram specification.

## Core Responsibilities

1. **Mermaid ERD Parsing**
   - Read and validate Mermaid `erDiagram` syntax
   - Identify entities, attributes, and relationships
   - Detect syntax errors and provide helpful error messages
   - Support crow's foot notation: `||--||`, `||--o{`, `}o--o{`, `}o--||`

2. **Entity Validation**
...
```

#### Step 18
Use the agent to generate JPA entities from the Mermaid ERD diagram in the auction-schema.mmd file.
Try the following prompt:

```
 - Compare auction-schema.mmd against the codebase. List any missing entities or discrepancies.
```

### Repositories
A repository is a high-level interface that provides a set of methods for performing common CRUD operations.
Repositories simplify transaction management. EntityManager requires manual transaction control.
EntityManager provides fine-grained control over persistent entities' lifecycle by managing detached and transient entities,
but Repositories provide caching options and predefined query methods, optimizing both the performance and the development process of the applications.

Spring repositories are interfaces that extend
the generic interface org.springframework.data.repository.Repository.

![External Image](https://bafybeiexvy3z5nwpx2m6tiowtpt5xlhh5t2zquicfib5ibkjwnsb254tjq.ipfs.w3s.link/repositories.png)



#### Step 19
Add a new package: src.main.java.awbd.lab3.repositories.
Add CrudRepository/PagingAndSortingRepository implementation for all entities:
ParticipantRepository, ProductRepository, CategoryRepository.

```java 	
package com.awbd.lab2.repositories;
import com.awbd.lab2.domain.Category;
import org.springframework.data.repository.CrudRepository;
public interface CategoryRepository extends CrudRepository<Category, Long> {

}
```


```java 
package com.awbd.lab2.repositories;

import com.awbd.lab2.domain.Participant;
import org.springframework.data.repository.CrudRepository;
public interface ParticipantRepository extends CrudRepository<Participant, Long> {

}
```

```java 
package com.awbd.lab2.repositories;
import com.awbd.lab2.domain.Product;

import org.springframework.data.repository.PagingAndSortingRepository;
public interface ProductRepository extends PagingAndSortingRepository<Product, Long> {

    Optional<Product> findById (Long id);
    Optional<Product> findByName (String name);

    Product save(Product product);
}
```


### Entities Cascade Types
Cascade types specify how state changes are propagated from Parent entity to Child entities.

**JPA cascade types**:
- **ALL:** propagates all operations from a parent to a child entity.

- **PERSIST:** propagates persist operation. This option is used only for new entities (TRANSIENT entities) for which there is no associated record in the database.
  SQL insert statements are propagated to child entities.

- **MERGE:** propagates merge operation.
  Merge operation is used only for DETACHED entities, to reattach entities in the context and perform update to the associated database records.
  SQL update statements are propagated to child entities.

- **REMOVE:** propagates remove/delete operations.
  SQL delete statements are propagated to child entities.

- **REFRESH:** if parent entity is re-read from the database, child entity is also re-read form the database.

- **DETACH:** if parent entity is removed from the context, child entity is also removed from the context.


#### Step 20
Add a test to check cascade type PERSIST. The test will pass only if we set CascadeType for the relationship product-info.

```java 	
@DataJpaTest
@ActiveProfiles("h2")
public class CascadeTypesTest {

  @Autowired
  ProductRepository productRepository;
  
  @Test
  public void insertProduct(){
    Product product = new Product();
    product.setName("The Vase of Tulips");
    product.setCurrency(Currency.USD);

    Info info = new Info();
    info.setDescription("Painting by Paul Cezanne");

    product.setInfo(info);
    productRepository.save(product);

    Optional<Product> productOpt = productRepository.findByName("The Vase of Tulips");
    assertTrue(productOpt.isPresent());
    product = productOpt.get();
    assertEquals(Currency.USD, product.getCurrency());
    assertEquals("Painting by Paul Cezanne", product.getInfo().getDescription());

  }

}
```

```java
@OneToOne(mappedBy = "product", cascade = CascadeType.ALL)
private Info info;
```

#### Step 21
Add a test class for ProductRepository. The test will use save and find methods.

```java 
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("h2")
public class CascadeTypesTest {
    //...

    @Test
    public void updateDescription() {
        Optional<Product> productOpt = productRepository.findById(1L);
        Product product = productOpt.get();
        product.getInfo().setDescription("Painting by Paul Cezanne");
        product.setCurrency(Currency.USD);

        productRepository.save(product);

        productOpt = productRepository.findById(1L);
        assertTrue(productOpt.isPresent());
        product = productOpt.get();
        assertEquals(Currency.USD, product.getCurrency());
        assertEquals("Painting by Paul Cezanne", product.getInfo().getDescription());

    }
}
```

#### Step 22
Add a test that will update the currency for all products
linked to a certain seller.

```java 
@Test
public void updateParticipant(){
Optional<Product> productOpt = productRepository.findById(2L);

    Participant participant = productOpt.get().getSeller();
    participant.setFirstName("William");
    participant.changeCurrency(Currency.GBP);

    Product product = new Product();
    product.setName("The Vase of Tulips");
    product.setCurrency(Currency.GBP);
    participant.getProducts().add(product);

    participantRepository.save(participant);

    Optional<Participant> participantOpt = participantRepository.findById(2L);
    participant = participantOpt.get();
    participant.getProducts().forEach(prod -> 
        assertEquals(Currency.GBP, prod.getCurrency()));

}
```

The test will pass only if we set the cascade type for the relationship
participant-product.

```java 
@OneToMany(mappedBy = "seller", cascade = CascadeType.MERGE)
private List<Product> products;
```

#### Step 23
Add orphanRemoval attribute to the annotation OneToMany for the relationship participant-product.
If OrphanRemoval attribute is set to true,
a remove entity state transition
is triggered for the child entity,
when it is no longer referenced by its parent entity.

```java 
@OneToMany(mappedBy = "seller", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Product> products;
```

A test that will delete a participant and check if that product linked to the removed participant is also removed.

```java 
@Test
public void deleteParticipant(){
    participantRepository.deleteById(2L);
    Optional<Product> product = productRepository.findById(2L);

    //without orphan removal
    //assertFalse(product.isEmpty());

    //with orphan removal true
    assertTrue(product.isEmpty());
}
```


### Finder methods

Interfaces extending CrudRepository may include finder methods with the following naming convention:

findByAttribute**Keyword**Attribute

**Keyword** is one of the following:
And, Or, Like, IsNot, OrderBy, GreaterThan, IsNull, StartingWith etc.

Examples:
- findByName(String name) - - WHERE name = name.
- findByNameAndDescription(String name, String desc) - - WHERE name = name or description = desc
- findByNameLike(String name) - - WHERE name LIKE 'name%'.
- findByValueGraterThan(Double val) - - WHERE values > val
- findByNameOrderByNameDesc(String name) - - ORDER BY name DESC

SpringData JPA will automatically generate implementations for these methods.

#### Step 24
Add finder methods in ParticipantRepository class:
```java
List<Participant> findByLastNameLike(String lastName);
List<Participant> findByIdIn(List<Long> ids);
```

#### Step 25
Add a test class ParticipantRepositoryTest.

```java
@DataJpaTest
@ActiveProfiles("h2")
@Slf4j
public class ParticipantRepositoryTest {

    ParticipantRepository participantRepository;

    @Autowired
    ParticipantRepositoryTest(ParticipantRepository participantRepository) {
        this.participantRepository = participantRepository;
    }


    @Test
    public void findByName() {
        List<Participant> participants = participantRepository.findByLastNameLike("%no%");
        assertFalse(participants.isEmpty());
        log.info("findByLastNameLike ...");
        participants.forEach(participant -> log.info(participant.getLastName()));
    }
}
```

#### Step 26
Add a test for findByIdIn method.
```java
@Test public void findByIds() {
    List<Participant> participants = participantRepository.findByIdIn(Arrays.asList(1L,2L));
    assertFalse(participants.isEmpty());
    log.info("findByIds ...");
    participants.forEach(participant -> log.info(participant.getLastName()));
}
```

### Query annotation

Custom SQL query may be defined using @Query annotation.
Queries are written in JPQL or in native sql. For native sql attribute native: _Query ( , native = true)_ must be added to the Query annotation.

JPQL is an object-oriented query language. It uses the entity objects to define operations on the database records.
JPQL queries are transformed to SQL.
There are two ways of transferring parameters to queries:

**Indexed Query Parameters**
Spring Data will pass method parameters to the query in the same order they appear in the method declaration:

```java
@Query("select p from Product p where p.seller.firstName = ?1 and p.seller.lastName = ?2") 
List<Product> findBySellerName(String sellerFirstName, String sellerLastName);
```

**Named Parameters** We use the @Param annotation in the method declaration to match parameters defined by name in JPQL with parameters from the method declaration:
```java
@Query("select p from Product p where p.seller.firstName = :firstName and p.seller.lastName = :lastName") 
List<Product> findBySellerName(@Param("firstName") String sellerFirstName, @Param("lastName") String sellerLastName);
```

#### Step 27
Add a method findBySeller in ProductRepository class.
```java
@Query("select p from Product p where p.seller.id = ?1")
List<Product> findBySeller(Long sellerId);
```

#### Step 28
Add method findBySellerName with Named Parameters in ProductRepository
and create a test method in class ProductRepositoryTest.

```java
@Query("select p from Product p where p.seller.firstName = :firstName and p.seller.lastName = :lastName")
List<Product> findBySellerName(@Param("firstName") String sellerFirstName, @Param("lastName") String sellerLastName);
```

```java
@DataJpaTest
@ActiveProfiles("h2")
@Slf4j
public class ProductRepositoryTest {
    
    ProductRepository productRepository;
    @Autowired
    ProductRepositoryTest(ProductRepository productRepository){
        this.productRepository = productRepository;
    }

    @Test
    public void findProducts() {
        List<Product> products = productRepository.findBySeller(1L);
        assertTrue(products.size() >= 1);
        log.info("findBySeller ...");
        products.forEach(product -> log.info(product.getName()));
    }

    @Test
    public void findProductsBySellerName() {
        List<Product> products = productRepository.findBySellerName("Will","Snow");
        assertTrue(products.size() >= 1);
        log.info("findBySeller BySellerName ...");
        products.forEach(product -> log.info(product.getName()));
    }

}
```


### References
[1] https://www.baeldung.com/jpa-hibernate-persistence-context

[2] https://www.baeldung.com/spring-data-rest-relationships


