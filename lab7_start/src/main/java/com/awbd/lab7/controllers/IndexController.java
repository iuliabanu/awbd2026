package com.awbd.lab7.controllers;

import com.awbd.lab7.services.MovieService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

// Step 9: add IReactiveDataDriverContextVariable for data-driven Thymeleaf rendering
@Slf4j
@Controller
@RequestMapping("/")
public class IndexController {

    private final MovieService movieService;

    public IndexController(MovieService movieService) {
        this.movieService = movieService;
    }

    @RequestMapping({"", "/", "/index"})
    public String getIndexPage(Model model) {
        model.addAttribute("movies", movieService.findAll());
        return "movieList";
    }
}
