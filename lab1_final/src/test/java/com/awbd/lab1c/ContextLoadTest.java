package com.awbd.lab1c;

import org.junit.jupiter.api.Test;
import org.springframework.context.support.ClassPathXmlApplicationContext;

public class ContextLoadTest {

    @Test
    public void propertyDITest() {
        ClassPathXmlApplicationContext context =
                new ClassPathXmlApplicationContext("applicationContextC.xml");
        Subscription mySportSubscription = context.getBean("mySportSubscription", Subscription.class);
        System.out.println(mySportSubscription.getPrice() + " "
                + mySportSubscription.getDescription());
        context.close();
    }

    @Test
    public void constructorDITest() {
        ClassPathXmlApplicationContext context =
                new ClassPathXmlApplicationContext("applicationContextC.xml");
        Subscription myBooksSubscription = context.getBean("myBooksSubscription", Subscription.class);
        System.out.println(myBooksSubscription.getPrice() + " "
                + myBooksSubscription.getDescription());
        context.close();
    }

    @Test
    public void setterDITest() {
        ClassPathXmlApplicationContext context =
                new ClassPathXmlApplicationContext("applicationContextC.xml");
        Subscription myMoviesSubscription = context.getBean("myMoviesSubscription", Subscription.class);
        System.out.println(myMoviesSubscription.getPrice() + " "
                + myMoviesSubscription.getDescription());
        context.close();
    }
}