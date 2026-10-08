from io import BytesIO
from html import escape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from .content import SYMPTOMS

def make_pdf(prediction, user, names):
    out = BytesIO()
    doc = SimpleDocTemplate(out, pagesize=(612, 792), rightMargin=52, leftMargin=52, topMargin=52, bottomMargin=52)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="ReportTitle", parent=styles["Heading1"], fontSize=20, leading=25, textColor=colors.HexColor("#164b55"), spaceAfter=15))
    styles.add(ParagraphStyle(name="ReportSmall", parent=styles["BodyText"], leading=18, spaceAfter=10))
    content = [Paragraph("ClarityCare | Symptom Explorer", styles["ReportTitle"]), Paragraph("Educational summary - NOT a medical diagnosis", styles["Heading3"]), Spacer(1, 14)]
    content.append(Paragraph(f"Name: {escape(user.name)}", styles["ReportSmall"]))
    content.append(Paragraph(f"Record #{prediction.id} | {prediction.created_at.strftime('%d %B %Y, %H:%M')} UTC", styles["ReportSmall"]))
    content.append(Paragraph("Symptoms selected: " + ", ".join(escape(SYMPTOMS.get(key, key)) for key in prediction.symptoms), styles["ReportSmall"]))
    content.append(Spacer(1, 8))
    if prediction.urgent:
        content.append(Paragraph("Urgent safety message", styles["Heading2"]))
        content.append(Paragraph("One or more symptoms selected may require urgent assessment. Seek immediate medical care or local emergency services. No pattern ranking was generated.", styles["ReportSmall"]))
    else:
        content.append(Paragraph("Model-ranked symptom patterns", styles["Heading2"]))
        rows = [["Symptom pattern", "Demo model score"]] + [[names.get(entry["slug"], entry["slug"]), f'{entry["score"]:.1f}%'] for entry in prediction.matches]
        table = Table(rows, colWidths=[350, 140], hAlign="LEFT")
        table.setStyle(TableStyle([("BACKGROUND", (0,0),(-1,0),colors.HexColor("#e0f3f0")), ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#f6f9fa")]),("BOTTOMPADDING",(0,0),(-1,-1),11),("TOPPADDING",(0,0),(-1,-1),11), ("TEXTCOLOR",(0,0),(-1,-1),colors.HexColor("#17334a"))]))
        content.append(table)
    content.extend([Spacer(1, 22), Paragraph("Important limitations", styles["Heading2"]), Paragraph("This model was trained only on synthetic teaching examples. Scores represent model ranking of simulated patterns, not the probability of a real disease. They are not clinically validated, cannot rule out illness, and should not be used for self-diagnosis or treatment decisions.", styles["ReportSmall"]), Paragraph("If symptoms are persistent, worsening, or concerning, contact a qualified healthcare professional. Seek emergency help for chest pain, severe breathing difficulty, new confusion, fainting, or a sudden severe headache.", styles["ReportSmall"])])
    doc.build(content)
    out.seek(0)
    return out
