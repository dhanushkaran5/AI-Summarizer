package com.intellidoc.service;

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

public interface FileStorageService {
    String storeFile(MultipartFile file) throws IOException;
    String storeFile(MultipartFile file, String customFilename) throws IOException;
    Path getFilePath(String filename);
    Resource loadAsResource(String filename) throws MalformedURLException;
    void deleteFile(String filename);
    boolean exists(String filename);
}
