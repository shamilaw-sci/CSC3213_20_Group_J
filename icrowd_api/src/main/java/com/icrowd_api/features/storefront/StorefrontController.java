package com.icrowd_api.features.storefront;

import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import javax.imageio.ImageIO;
import java.io.*;
import java.util.UUID;

@RestController
public class StorefrontController {
    private final StorefrontHeroRepository repository;
    public StorefrontController(StorefrontHeroRepository repository) { this.repository = repository; }
    public record HeroView(String headline, String subtitle, String imageUrl) {}
    private HeroView view(StorefrontHero hero) {
        return new HeroView(hero.getHeadline(), hero.getSubtitle(), hero.getImage() == null ? null : "/storefront/hero/image?v=" + hero.getImageVersion());
    }
    @GetMapping("/api/storefront/hero")
    @Transactional(readOnly = true)
    public HeroView get() { return repository.metadata().map(h -> new HeroView(h.getHeadline(),h.getSubtitle(),h.getImageVersion()==null ? null : "/storefront/hero/image?v="+h.getImageVersion())).orElseGet(() -> view(new StorefrontHero())); }

    @GetMapping("/api/storefront/hero/image")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> image(@RequestParam(required=false) String v,@RequestHeader(value="If-None-Match",required=false) String ifNoneMatch) {
        var metadata=repository.metadata().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(metadata.getImageVersion()==null || (v!=null && !v.equals(metadata.getImageVersion()))) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        String etag="\""+metadata.getImageVersion()+"\"";
        CacheControl policy=v==null ? CacheControl.noCache() : CacheControl.maxAge(java.time.Duration.ofDays(365)).cachePublic().immutable();
        if(etag.equals(ifNoneMatch)) return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).cacheControl(policy).build();
        StorefrontHero hero = repository.findById(1L).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (hero.getImage() == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(hero.getContentType()))
                .eTag(etag).cacheControl(policy).body(hero.getImage());
    }

    @PutMapping(value = "/api/admin/storefront/hero", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public HeroView save(@RequestParam String headline, @RequestParam String subtitle,
                         @RequestParam(required = false) MultipartFile image,
                         @RequestParam(defaultValue = "false") boolean resetImage) throws IOException {
        if (headline.isBlank() || headline.length() > 80 || subtitle.isBlank() || subtitle.length() > 180)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a headline up to 80 characters and a description up to 180 characters.");
        StorefrontHero hero = repository.findById(1L).orElseGet(StorefrontHero::new);
        if (resetImage) { hero.setImage(null); hero.setContentType(null); hero.setImageVersion(null); }
        if (image != null && !image.isEmpty()) {
            if (image.getSize() > 5 * 1024 * 1024) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image smaller than 5 MB.");
            byte[] bytes = image.getBytes();
            try (var stream = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                var readers = ImageIO.getImageReaders(stream);
                if (!readers.hasNext()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a JPEG or PNG image.");
                var reader = readers.next();
                try {
                    reader.setInput(stream);
                    String format = reader.getFormatName().toLowerCase();
                    if (!format.equals("jpeg") && !format.equals("png")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a JPEG or PNG image.");
                    int width = reader.getWidth(0), height = reader.getHeight(0);
                    if (width < 800 || height < 300 || width > 6000 || height > 4000)
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image between 800 × 300 and 6000 × 4000 pixels.");
                    // Re-encode decoded pixels, rather than serving arbitrary uploaded bytes.
                    var output = new ByteArrayOutputStream();
                    ImageIO.write(reader.read(0), format, output);
                    if (output.size() > 5 * 1024 * 1024) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a smaller image.");
                    hero.setImage(output.toByteArray());
                    hero.setContentType(format.equals("png") ? "image/png" : "image/jpeg");
                    hero.setImageVersion(UUID.randomUUID().toString());
                } finally { reader.dispose(); }
            } catch (IOException ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This image could not be read. Choose another JPEG or PNG."); }
        }
        hero.setHeadline(headline.trim()); hero.setSubtitle(subtitle.trim());
        return view(repository.save(hero));
    }
}
