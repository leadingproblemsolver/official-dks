import { jsPDF } from 'jspdf';

export const generateDecisionPDF = (input: string, result: any) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();

  // Branding/Header
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('DECISION_KILL-SWITCH // SURGICAL_LOGIC_ENGINE', 15, 15);
  doc.setTextColor(100, 100, 100);
  doc.text(`TIMESTAMP: ${timestamp}`, 15, 20);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 25, 195, 25);

  // Input Block
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('courier', 'bold');
  doc.text('[INPUT_INTENT]', 15, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const splitInput = doc.splitTextToSize(input, 180);
  doc.text(splitInput, 15, 42);

  let currentY = 42 + (splitInput.length * 5) + 10;

  // Verdict Header
  doc.setFontSize(12);
  doc.setFont('courier', 'bold');
  doc.text('[VERDICT_EXTRACTION]', 15, currentY);
  currentY += 10;

  // Verdict Value
  const verdictColor = result.verdict === 'Kill' ? [225, 29, 72] : (result.verdict === 'Pause' ? [245, 158, 11] : [16, 185, 129]);
  doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
  doc.setFontSize(24);
  doc.text(result.verdict.toUpperCase(), 15, currentY);
  currentY += 12;

  // Details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('courier', 'bold');
  doc.text(`CONFIDENCE: ${result.confidence}%`, 15, currentY);
  currentY += 7;
  doc.text(`CLASSIFICATION: ${result.input_type.toUpperCase()}`, 15, currentY);
  currentY += 10;

  // Analysis Cards
  const drawModule = (title: string, content: string, y: number) => {
    doc.setFont('courier', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(title, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const splitText = doc.splitTextToSize(content, 180);
    doc.text(splitText, 15, y + 5);
    return y + 5 + (splitText.length * 5) + 5;
  };

  currentY = drawModule('RISK_ASSESSMENT:', result.biggest_risk, currentY);
  currentY = drawModule('FALSIFICATION_CONDITION:', result.what_breaks_this, currentY);
  currentY = drawModule('ADAPTIVE_PERSPECTIVE:', result.relatable_perspective, currentY);
  currentY = drawModule('COGNITIVE_REFRAME (PRECISE):', result.reframe_precise, currentY);
  currentY = drawModule('COGNITIVE_REFRAME (REGULAR):', result.reframe_regular, currentY);

  // Secondary Nuances
  doc.setFont('courier', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('SECONDARY_NUANCES:', 15, currentY);
  currentY += 5;
  
  result.secondary_nuances.forEach((nuance: any, idx: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(9);
    doc.text(`${idx + 1}. ${nuance.reason}`, 15, currentY);
    currentY += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const splitNuance = doc.splitTextToSize(`Nuance: ${nuance.nuance}`, 180);
    doc.text(splitNuance, 15, currentY);
    currentY += (splitNuance.length * 4);
    
    doc.setFont('courier', 'bold');
    doc.setTextColor(140, 140, 140);
    doc.text(`ONLY_DO_IF: ${nuance.only_do_if}`, 15, currentY);
    currentY += 8;
  });

  // Footer
  doc.setFont('courier', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('"The strongest decisions are forged in the fire of their own potential failure."', 105, 285, { align: 'center' });

  doc.save(`kill-switch_${Date.now()}.pdf`);
};
