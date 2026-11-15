package com.icrowd_api.features.order;
import com.icrowd_api.features.auth.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import java.nio.file.*;
import java.io.*;
import java.util.*;

@Service
public class ReceiptService {
    private final OrderRepository orders;
    private final UserRepository users;
    @org.springframework.beans.factory.annotation.Value("${app.receipts.directory:uploads}") private String directory;
    public ReceiptService(OrderRepository orders, UserRepository users) { this.orders=orders; this.users=users; }
    private void authorize(Order order, Authentication actor) {
        if (actor==null) throw new org.springframework.security.access.AccessDeniedException("Sign in first.");
        if (actor.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN")))
            OrderAccess.requireOwner(users,order,actor.getName());
    }
    private Path location(String filename) {
        Path root=Path.of(directory).toAbsolutePath().normalize();
        Path path=root.resolve(filename).normalize();
        if (!path.getParent().equals(root)) throw new IllegalArgumentException("Invalid receipt path.");
        return path;
    }
    @Transactional
    public String save(Long id, MultipartFile upload, Authentication actor) throws IOException {
        Order order=orders.findForUpdate(id).orElseThrow(); authorize(order,actor);
        if (upload.isEmpty() || upload.getSize()>5*1024*1024) throw new IllegalArgumentException("Choose a receipt smaller than 5 MB.");
        if (order.getReceiptFileName()==null && orders.countByUserIdAndReceiptFileNameIsNotNull(order.getUser().getId())>=20)
            throw new IllegalArgumentException("Receipt storage limit reached. Contact support.");
        byte[] bytes=upload.getBytes();
        String type;
        if (bytes.length>5 && new String(bytes,0,5,java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-")) type="application/pdf";
        else {
            try (var input=javax.imageio.ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                var readers=javax.imageio.ImageIO.getImageReaders(input);
                if (!readers.hasNext()) throw new IllegalArgumentException("Choose a PDF, JPEG or PNG receipt.");
                var reader=readers.next();
                try {
                    reader.setInput(input);
                    String format=reader.getFormatName().toLowerCase(Locale.ROOT);
                    if (!Set.of("png","jpeg").contains(format) || reader.getWidth(0)>6000 || reader.getHeight(0)>4000)
                        throw new IllegalArgumentException("Choose a JPEG or PNG no larger than 6000 by 4000 pixels.");
                    var encoded=new ByteArrayOutputStream(); javax.imageio.ImageIO.write(reader.read(0),format,encoded);
                    bytes=encoded.toByteArray(); type=format.equals("png")?"image/png":"image/jpeg";
                } finally { reader.dispose(); }
            }
        }
        if (bytes.length>5*1024*1024) throw new IllegalArgumentException("Receipt is too large.");
        Path target=location(id+".receipt"); Files.createDirectories(target.getParent());
        Path temp=Files.createTempFile(target.getParent(),"receipt-",".tmp");
        try { Files.write(temp,bytes); Files.move(temp,target,StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING); }
        finally { Files.deleteIfExists(temp); }
        String legacy=order.getReceiptUrl();
        order.setReceiptFileName(target.getFileName().toString()); order.setReceiptContentType(type);
        order.setReceiptUrl("/api/orders/"+id+"/receipt");
        if (legacy!=null && legacy.matches("/uploads/[a-fA-F0-9-]{36}\\.(pdf|png|jpg|jpeg)"))
            Files.deleteIfExists(location(legacy.substring("/uploads/".length())));
        return order.getReceiptUrl();
    }
    @Transactional(readOnly=true)
    public ResponseEntity<byte[]> download(Long id, Authentication actor) throws IOException {
        Order order=orders.findById(id).orElseThrow(); authorize(order,actor);
        String filename=order.getReceiptFileName();
        if (filename==null && order.getReceiptUrl()!=null && order.getReceiptUrl().matches("/uploads/[a-fA-F0-9-]{36}\\.[a-zA-Z0-9]+"))
            filename=order.getReceiptUrl().substring("/uploads/".length());
        if (filename==null) return ResponseEntity.notFound().build();
        Path file=location(filename);
        if (!Files.isRegularFile(file) || Files.size(file)>5*1024*1024) return ResponseEntity.notFound().build();
        String type=order.getReceiptContentType();
        String extension="application/pdf".equals(type)?".pdf":"image/png".equals(type)?".png":"image/jpeg".equals(type)?".jpg":".bin";
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).cacheControl(CacheControl.noStore())
            .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename("receipt-"+id+extension).build().toString())
            .body(Files.readAllBytes(file));
    }
}
