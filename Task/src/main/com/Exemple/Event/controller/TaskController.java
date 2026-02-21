package com.Exemple.Event.controller;


import com.Exemple.Event.mapper.TaskMapper;
import com.Exemple.Event.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/event")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService eventService;
    private final TaskMapper taskMapper;

}
