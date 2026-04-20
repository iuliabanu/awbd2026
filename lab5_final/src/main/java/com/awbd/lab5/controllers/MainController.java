package com.awbd.lab5.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    @GetMapping("/")
    public String home() {
        return "main";
    }

    @GetMapping("/login")
    public String showLogInForm() {
        return "login";
    }

    @GetMapping("/access_denied")
    public String accessDeniedPage() {
        return "accessDenied";
    }
}

