using System.Text;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.EntityFrameworkCore;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Storage;

namespace UohMeetings.Api.Services;

public sealed class MomExportService(AppDbContext db, IFileStorage storage, IConfiguration config)
{
    public async Task<(StoredFile wordFile, StoredFile pdfFile)> ExportAndStoreAsync(Guid momId, CancellationToken ct)
    {
        var mom = await db.Moms
            .Include(m => m.Attendance)
            .Include(m => m.AgendaMinutes)
            .Include(m => m.Decisions)
            .Include(m => m.Recommendations)
            .ThenInclude(r => r.SubTasks)
            .FirstOrDefaultAsync(m => m.Id == momId, ct);

        if (mom is null) throw new InvalidOperationException("MOM_NOT_FOUND");

        var meeting = await db.Meetings.AsNoTracking().FirstAsync(m => m.Id == mom.MeetingId, ct);

        var docx = BuildDocx(meeting.TitleEn, mom);
        var pdf = BuildPdf(meeting.TitleEn, mom);

        var bucket = config["Storage:Minio:Bucket"] ?? "uoh-meetings";
        var container = config["Storage:AzureBlob:Container"] ?? "uoh-meetings";
        var bucketOrContainer = storage.Provider == "azure" ? container : bucket;

        var prefix = $"moms/{mom.Id:N}";

        var wordKey = $"{prefix}/mom.docx";
        var pdfKey = $"{prefix}/mom.pdf";

        await storage.UploadAsync(
            bucketOrContainer,
            wordKey,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            docx,
            ct
        );

        await storage.UploadAsync(bucketOrContainer, pdfKey, "application/pdf", pdf, ct);

        var wordFile = new StoredFile
        {
            Provider = storage.Provider,
            BucketOrContainer = bucketOrContainer,
            ObjectKey = wordKey,
            FileName = "mom.docx",
            ContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            SizeBytes = docx.LongLength,
            Classification = Enums.FileClassification.Internal,
        };
        var pdfFile = new StoredFile
        {
            Provider = storage.Provider,
            BucketOrContainer = bucketOrContainer,
            ObjectKey = pdfKey,
            FileName = "mom.pdf",
            ContentType = "application/pdf",
            SizeBytes = pdf.LongLength,
            Classification = Enums.FileClassification.Internal,
        };

        db.StoredFiles.AddRange(wordFile, pdfFile);

        mom.WordDocUrl = $"/api/v1/files/{wordFile.Id}/download";
        mom.PdfDocUrl = $"/api/v1/files/{pdfFile.Id}/download";

        await db.SaveChangesAsync(ct);
        return (wordFile, pdfFile);
    }

    private static byte[] BuildDocx(string meetingTitle, Entities.Mom mom)
    {
        using var ms = new MemoryStream();
        using (var doc = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document, true))
        {
            var main = doc.AddMainDocumentPart();
            main.Document = new Document(new Body());
            var body = main.Document.Body!;

            body.Append(Para($"Minutes of Meeting (MOM)", bold: true, size: 32));
            body.Append(Para(meetingTitle, bold: true, size: 28));
            body.Append(Para($"Status: {mom.Status}"));
            body.Append(Para(""));

            body.Append(Para("Attendance", bold: true));
            foreach (var a in mom.Attendance.OrderByDescending(x => x.IsPresent))
                body.Append(Para($"- {a.DisplayName} ({a.Email}) — {(a.IsPresent ? "Present" : $"Absent: {a.AbsenceReason}")}"));

            body.Append(Para(""));
            body.Append(Para("Decisions", bold: true));
            foreach (var d in mom.Decisions)
                body.Append(Para($"- {d.TitleEn} / {d.TitleAr}"));

            body.Append(Para(""));
            body.Append(Para("Recommendations / Tasks", bold: true));
            foreach (var r in mom.Recommendations)
                body.Append(Para($"- {r.TitleEn} — Due: {r.DueDateUtc:yyyy-MM-dd} — {r.Status} — {r.Progress}%"));

            main.Document.Save();
        }

        return ms.ToArray();
    }

    private static Paragraph Para(string text, bool bold = false, int size = 24)
    {
        var runProps = new RunProperties(new FontSize { Val = (size * 2).ToString() });
        if (bold) runProps.Append(new Bold());
        var run = new Run(runProps, new Text(text) { Space = SpaceProcessingModeValues.Preserve });
        return new Paragraph(run);
    }

    private static byte[] BuildPdf(string meetingTitle, Entities.Mom mom)
    {
        var doc = new PdfDocument();
        var page = doc.AddPage();
        var gfx = XGraphics.FromPdfPage(page);

        var y = 40;
        var titleFont = new XFont("Arial", 16, XFontStyle.Bold);
        var normalFont = new XFont("Arial", 10, XFontStyle.Regular);

        gfx.DrawString("Minutes of Meeting (MOM)", titleFont, XBrushes.Black, new XRect(40, y, page.Width - 80, 20));
        y += 26;
        gfx.DrawString(meetingTitle, new XFont("Arial", 12, XFontStyle.Bold), XBrushes.Black, new XRect(40, y, page.Width - 80, 20));
        y += 24;
        gfx.DrawString($"Status: {mom.Status}", normalFont, XBrushes.Black, new XRect(40, y, page.Width - 80, 20));
        y += 18;

        var sb = new StringBuilder();
        sb.AppendLine("Attendance:");
        foreach (var a in mom.Attendance.OrderByDescending(x => x.IsPresent))
            sb.AppendLine($"- {a.DisplayName} — {(a.IsPresent ? "Present" : $"Absent: {a.AbsenceReason}")}");

        sb.AppendLine();
        sb.AppendLine("Decisions:");
        foreach (var d in mom.Decisions) sb.AppendLine($"- {d.TitleEn}");

        sb.AppendLine();
        sb.AppendLine("Recommendations:");
        foreach (var r in mom.Recommendations) sb.AppendLine($"- {r.TitleEn} — {r.Status} — {r.Progress}%");

        gfx.DrawString(sb.ToString(), normalFont, XBrushes.Black, new XRect(40, y, page.Width - 80, page.Height - y - 40));

        using var ms = new MemoryStream();
        doc.Save(ms, false);
        return ms.ToArray();
    }
}

