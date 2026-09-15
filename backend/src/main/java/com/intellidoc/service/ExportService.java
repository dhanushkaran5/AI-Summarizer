package com.intellidoc.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellidoc.entity.Summary;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class ExportService {

    @Autowired
    private ObjectMapper objectMapper;

    public byte[] exportToPdf(Summary summary) throws DocumentException, IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        com.lowagie.text.Document doc = new com.lowagie.text.Document(PageSize.A4, 40, 40, 50, 50);
        PdfWriter.getInstance(doc, out);
        doc.open();

        // Colors
        Color primaryIndigo = new Color(99, 102, 241);
        Color darkSlate = new Color(15, 23, 42);
        Color mutedGray = new Color(100, 116, 139);

        // Fonts
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, primaryIndigo);
        Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 11, mutedGray);
        Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, darkSlate);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, darkSlate);
        Font boldBody = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkSlate);

        // Header Title
        String title = summary.getTitle() != null && !summary.getTitle().isBlank() 
                ? summary.getTitle() : "Summarize AI Executive Brief";
        Paragraph titlePara = new Paragraph(title, titleFont);
        titlePara.setSpacingAfter(4);
        doc.add(titlePara);

        // Subtitle / Tagline
        Paragraph subPara = new Paragraph("Turn long content into clear, intelligent understanding.", subtitleFont);
        subPara.setSpacingAfter(14);
        doc.add(subPara);

        // Metadata Table
        PdfPTable metaTable = new PdfPTable(4);
        metaTable.setWidthPercentage(100);
        metaTable.setSpacingAfter(18);

        addMetaCell(metaTable, "Mode", summary.getMode());
        addMetaCell(metaTable, "Length", summary.getLength());
        addMetaCell(metaTable, "Persona", summary.getPersona());
        addMetaCell(metaTable, "Confidence", summary.getConfidenceScore() != null 
                ? String.format("%.0f%%", summary.getConfidenceScore() * 100) : "N/A");
        doc.add(metaTable);

        // Content Sections
        if (summary.getSectionsJson() != null && !summary.getSectionsJson().isBlank()) {
            try {
                List<Map<String, Object>> sections = objectMapper.readValue(
                        summary.getSectionsJson(), new TypeReference<List<Map<String, Object>>>() {});
                for (Map<String, Object> sec : sections) {
                    String secTitle = (String) sec.get("title");
                    String secContent = (String) sec.get("content");
                    if (secTitle != null && secContent != null && !secContent.isBlank()) {
                        Paragraph h = new Paragraph(secTitle, headingFont);
                        h.setSpacingBefore(10);
                        h.setSpacingAfter(4);
                        doc.add(h);

                        Paragraph b = new Paragraph(secContent, bodyFont);
                        b.setSpacingAfter(8);
                        doc.add(b);
                    }
                }
            } catch (Exception e) {
                // fallback to summaryText
                doc.add(new Paragraph(summary.getSummaryText(), bodyFont));
            }
        } else if (summary.getSummaryText() != null) {
            doc.add(new Paragraph(summary.getSummaryText(), bodyFont));
        }

        // Key Insights
        if (summary.getInsightsJson() != null && !summary.getInsightsJson().isBlank()) {
            try {
                List<Map<String, Object>> insights = objectMapper.readValue(
                        summary.getInsightsJson(), new TypeReference<List<Map<String, Object>>>() {});
                if (!insights.isEmpty()) {
                    Paragraph insightHead = new Paragraph("Key Insights & Implications", headingFont);
                    insightHead.setSpacingBefore(16);
                    insightHead.setSpacingAfter(8);
                    doc.add(insightHead);

                    for (Map<String, Object> ins : insights) {
                        String insTitle = (String) ins.get("title");
                        String insText = (String) ins.get("insight");
                        String whyMatters = (String) ins.get("whyThisMatters");
                        String importance = (String) ins.get("importance");

                        Paragraph p = new Paragraph();
                        p.add(new Chunk("• " + insTitle + " (" + (importance != null ? importance.toUpperCase() : "INFO") + "): ", boldBody));
                        p.add(new Chunk(insText + " ", bodyFont));
                        if (whyMatters != null) {
                            p.add(new Chunk("[Impact: " + whyMatters + "]", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, mutedGray)));
                        }
                        p.setSpacingAfter(4);
                        doc.add(p);
                    }
                }
            } catch (Exception ignored) {
            }
        }

        doc.close();
        return out.toByteArray();
    }

    private void addMetaCell(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new Color(248, 250, 252));
        cell.setPadding(6);
        cell.addElement(new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, new Color(100, 116, 139))));
        cell.addElement(new Paragraph(value != null ? value : "N/A", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(15, 23, 42))));
        table.addCell(cell);
    }

    public byte[] exportToDocx(Summary summary) throws IOException {
        try (XWPFDocument doc = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Title
            XWPFParagraph titlePara = doc.createParagraph();
            titlePara.setAlignment(ParagraphAlignment.LEFT);
            XWPFRun titleRun = titlePara.createRun();
            titleRun.setText(summary.getTitle() != null ? summary.getTitle() : "Summarize AI Brief");
            titleRun.setBold(true);
            titleRun.setFontSize(20);
            titleRun.setColor("6366F1");

            // Tagline
            XWPFParagraph subPara = doc.createParagraph();
            XWPFRun subRun = subPara.createRun();
            subRun.setText("Turn long content into clear, intelligent understanding.");
            subRun.setFontSize(10);
            subRun.setColor("64748B");
            subRun.setItalic(true);

            // Metadata summary
            XWPFParagraph metaPara = doc.createParagraph();
            XWPFRun metaRun = metaPara.createRun();
            metaRun.setText(String.format("Mode: %s | Length: %s | Persona: %s | Generated: %s",
                    summary.getMode(), summary.getLength(), summary.getPersona(),
                    summary.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))));
            metaRun.setFontSize(9);
            metaRun.setColor("475569");

            // Sections
            if (summary.getSectionsJson() != null && !summary.getSectionsJson().isBlank()) {
                try {
                    List<Map<String, Object>> sections = objectMapper.readValue(
                            summary.getSectionsJson(), new TypeReference<List<Map<String, Object>>>() {});
                    for (Map<String, Object> sec : sections) {
                        String secTitle = (String) sec.get("title");
                        String secContent = (String) sec.get("content");
                        if (secTitle != null && secContent != null) {
                            XWPFParagraph headPara = doc.createParagraph();
                            XWPFRun headRun = headPara.createRun();
                            headRun.setText(secTitle);
                            headRun.setBold(true);
                            headRun.setFontSize(13);
                            headRun.setColor("0F172A");

                            XWPFParagraph bodyPara = doc.createParagraph();
                            XWPFRun bodyRun = bodyPara.createRun();
                            bodyRun.setText(secContent);
                            bodyRun.setFontSize(10);
                        }
                    }
                } catch (Exception e) {
                    XWPFParagraph p = doc.createParagraph();
                    p.createRun().setText(summary.getSummaryText());
                }
            } else if (summary.getSummaryText() != null) {
                XWPFParagraph p = doc.createParagraph();
                p.createRun().setText(summary.getSummaryText());
            }

            doc.write(out);
            return out.toByteArray();
        }
    }

    public String exportToMarkdown(Summary summary) {
        StringBuilder sb = new StringBuilder();
        sb.append("---\n");
        sb.append("title: \"").append(summary.getTitle() != null ? summary.getTitle() : "Summarize AI Brief").append("\"\n");
        sb.append("tagline: \"Turn long content into clear, intelligent understanding.\"\n");
        sb.append("mode: ").append(summary.getMode()).append("\n");
        sb.append("length: ").append(summary.getLength()).append("\n");
        sb.append("persona: ").append(summary.getPersona()).append("\n");
        sb.append("generatedAt: ").append(summary.getGeneratedAt()).append("\n");
        sb.append("---\n\n");

        sb.append("# ").append(summary.getTitle() != null ? summary.getTitle() : "Executive Brief").append("\n\n");
        sb.append("> **Summarize AI** — *Turn long content into clear, intelligent understanding.*\n\n");

        sb.append("| Mode | Length | Persona | Confidence |\n");
        sb.append("| :--- | :--- | :--- | :--- |\n");
        sb.append(String.format("| %s | %s | %s | %.0f%% |\n\n",
                summary.getMode(), summary.getLength(), summary.getPersona(),
                (summary.getConfidenceScore() != null ? summary.getConfidenceScore() * 100 : 0)));

        if (summary.getSectionsJson() != null && !summary.getSectionsJson().isBlank()) {
            try {
                List<Map<String, Object>> sections = objectMapper.readValue(
                        summary.getSectionsJson(), new TypeReference<List<Map<String, Object>>>() {});
                for (Map<String, Object> sec : sections) {
                    sb.append("### ").append(sec.get("title")).append("\n\n");
                    sb.append(sec.get("content")).append("\n\n");
                }
            } catch (Exception e) {
                sb.append(summary.getSummaryText()).append("\n\n");
            }
        } else if (summary.getSummaryText() != null) {
            sb.append(summary.getSummaryText()).append("\n\n");
        }

        return sb.toString();
    }
}
