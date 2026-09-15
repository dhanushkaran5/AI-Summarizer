package com.intellidoc.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + uploadDir, e);
        }
    }

    @Override
    public String storeFile(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String storedFilename = UUID.randomUUID() + extension;
        return storeFile(file, storedFilename);
    }

    @Override
    public String storeFile(MultipartFile file, String customFilename) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }
        Path destination = this.rootLocation.resolve(customFilename).normalize();
        if (!destination.getParent().equals(this.rootLocation)) {
            throw new SecurityException("Cannot store file outside current storage directory.");
        }
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        return customFilename;
    }

    @Override
    public Path getFilePath(String filename) {
        return this.rootLocation.resolve(filename).normalize();
    }

    @Override
    public Resource loadAsResource(String filename) throws MalformedURLException {
        Path filePath = getFilePath(filename);
        Resource resource = new UrlResource(filePath.toUri());
        if (resource.exists() && resource.isReadable()) {
            return resource;
        }
        throw new RuntimeException("File not found or unreadable: " + filename);
    }

    @Override
    public void deleteFile(String filename) {
        try {
            Path filePath = getFilePath(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
        }
    }

    @Override
    public boolean exists(String filename) {
        return Files.exists(getFilePath(filename));
    }
}
