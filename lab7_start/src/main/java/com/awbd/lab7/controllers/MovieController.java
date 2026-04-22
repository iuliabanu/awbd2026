package com.awbd.lab7.controllers;

import com.awbd.lab7.services.MovieService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Optional;

// Steps 10 & 12: convert return types to Mono<Rendering>
// and use Rendering.view(...).modelAttribute(...).build()
// Step 12: use flatMap + switchIfEmpty for reactive error propagation in showById
@Controller
@RequestMapping("/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @RequestMapping("/info/{id}")
    public String showById(@PathVariable String id, Model model) {
        model.addAttribute("movie", movieService.findById(id));
        return "movieInfo";
    }

    @RequestMapping("/delete/{id}")
    public String deleteById(@PathVariable String id) {
        movieService.deleteById(id);
        return "redirect:/index";
    }

    @RequestMapping({"", "/"})
    public String getMoviePage(
            @RequestParam("page") Optional<Integer> page,
            @RequestParam("size") Optional<Integer> size,
            Model model) {
        int currentPage = page.orElse(1);
        int pageSize = size.orElse(10);
        Page<?> moviePage = movieService.findPaginated(PageRequest.of(currentPage - 1, pageSize));
        model.addAttribute("moviePage", moviePage);
        return "moviePaginated";
    }
}
