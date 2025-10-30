// Type definitions for jsPDF 3.x with autoTable plugin 5.x

declare module 'jspdf' {
  export interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
    previousAutoTable?: {
      finalY: number;
    };
  }
}