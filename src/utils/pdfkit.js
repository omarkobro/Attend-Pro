import PDFDocument from "pdfkit";
import moment from "moment";

export const generateAttendancePDF = ({ groupName, subjectName, week, attendanceData }) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  // Header
  doc
    .fontSize(20)
    .fillColor("#1F2937") // Gray-800
    .text("Attendance Report", { align: "center" })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor("black")
    .text(`Subject: ${subjectName}`)
    .text(`Group: ${groupName}`)
    .text(`Week: ${week}`)
    .moveDown();

  // Summary
  const total = attendanceData.length;
  const attended = attendanceData.filter((r) => r.status === "attended").length;
  const pending = attendanceData.filter((r) => r.status === "pending").length;
  const absent = attendanceData.filter((r) => r.status === "absent").length;

  doc
    .fontSize(11)
    .text(`Summary:`)
    .text(`• Total Students: ${total}`)
    .text(`• Attended: ${attended}`)
    .text(`• Pending: ${pending}`)
    .text(`• Absent: ${absent}`)
    .moveDown();

  // Table
  const headers = ["No.", "Student Name", "Student ID", "Status", "Check-In", "Check-Out"];
  const colWidths = [40, 160, 100, 90, 90, 90];
  const startX = doc.x;
  let y = doc.y;
  const rowHeight = 20;

  // Header Row
  doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill("#E5E7EB");
  doc.fillColor("black").font("Helvetica-Bold").fontSize(10);

  headers.forEach((header, i) => {
    doc.text(header, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, y + 5, {
      width: colWidths[i] - 10,
      align: "left",
    });
  });

  y += rowHeight;

  // Table Rows
  attendanceData.forEach((record, index) => {
    const checkIn = record.checkInTime ? moment(record.checkInTime).format("hh:mm A") : "-";
    const checkOut = record.checkOutTime ? moment(record.checkOutTime).format("hh:mm A") : "-";

    const row = [
      index + 1,
      record.fullName,
      record.student_id,
      record.status,
      checkIn,
      checkOut,
    ];

    // Alternate row background
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
      .fill(index % 2 === 0 ? "#FFFFFF" : "#F9FAFB");

    doc.fillColor("black").font("Helvetica").fontSize(10);
    row.forEach((cell, i) => {
      doc.text(cell, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, y + 5, {
        width: colWidths[i] - 10,
        align: "left",
      });
    });

    y += rowHeight;

    // Add new page if needed
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = doc.y;
    }
  });

  // Signature Section
  doc
    .addPage()
    .moveDown(10)
    .fontSize(12)
    .text("Prepared By: ____________________________", { align: "left" })
    .moveDown(2)
    .text("Signature: ____________________________", { align: "left" });

  doc.end();
  return doc;
};
