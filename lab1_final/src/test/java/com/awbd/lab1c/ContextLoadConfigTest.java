package com.awbd.lab1c;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class ContextLoadConfigTest {

    @Test
    public void constructorDI(){
        AnnotationConfigApplicationContext context =
                new AnnotationConfigApplicationContext(SubscriptionConfig.class);

        Subscription myBooksSubscription = context.getBean("myBooksSubscription", Subscription.class);

        System.out.println(myBooksSubscription.getPrice() + " " + myBooksSubscription.getDescription());

        context.close();
    }

    @Test
    public void setterDI(){
        AnnotationConfigApplicationContext context =
                new AnnotationConfigApplicationContext(SubscriptionConfig.class);

        Subscription theSubscription = context.getBean("myMoviesSubscription", Subscription.class);

        System.out.println(theSubscription.getPrice() + " " + theSubscription.getDescription());

        context.close();
    }

    @Test
    public void propertyDITest() {
        AnnotationConfigApplicationContext context =
                new AnnotationConfigApplicationContext(SubscriptionConfig.class);
        Subscription mySportSubscription = context.getBean("mySportSubscription", Subscription.class);
        System.out.println(mySportSubscription.getPrice() + " "
                + mySportSubscription.getDescription());
        context.close();
    }
}