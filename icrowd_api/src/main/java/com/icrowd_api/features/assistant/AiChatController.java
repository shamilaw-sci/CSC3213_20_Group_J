package com.icrowd_api.features.assistant;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request, jakarta.servlet.http.HttpServletRequest http) {
        if (aiChatService.clientRateLimited(http.getRemoteAddr())) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS, "Please wait before sending another message");
        AiChatResponse response = aiChatService.processMessage(request);
        return ResponseEntity.ok(response);
    }
}
