import { Component, OnInit } from '@angular/core';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  logoUrl: string | null = null;
  currentDate: string = '';

  ngOnInit(): void {
    // Load logo from localStorage if available
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      this.logoUrl = savedLogo;
    }
    // Set current date
    const today = new Date();
    this.currentDate = today.toLocaleDateString();
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoUrl = e.target.result;
        // Save logo to localStorage for persistence
  localStorage.setItem('companyLogo', this.logoUrl || '');
      };
      reader.readAsDataURL(file);
    }
  }

  generateQuotation(): void {
    // Generate PDF with Company Info and Client Info
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Date at top right
    const today = new Date();
    const dateStr = today.toLocaleDateString();
    doc.setFontSize(12);
    doc.text('Date: ' + dateStr, pageWidth - 20, y, { align: 'right' });

    // Logo at top center (if available)
    if (this.logoUrl) {
      // Draw logo as faded background, or normal if preferred
      doc.addImage(this.logoUrl, 'PNG', pageWidth/2 - 30, y + 5, 60, 25);
      y += 32;
    } else {
      y += 10;
    }

    // Heading centered, colored
    doc.setFontSize(22);
    doc.setTextColor(25, 118, 210); // Beautiful blue
    doc.text((this.companyName ? this.companyName + ' Quotation' : 'Quotation'), pageWidth/2, y, { align: 'center' });
    doc.setTextColor(0,0,0); // Reset to black
    y += 18;

    // Company Info
    doc.setFontSize(16);
    doc.text('Company Info', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.text('Name: ' + (this.companyName || ''), 20, y);
    y += 8;
    doc.text('Address: ' + (this.companyAddress || ''), 20, y);
    y += 8;
    doc.text('Mobile: ' + (this.companyMobile || ''), 20, y);
    y += 12;

    // Client Info
    doc.setFontSize(16);
    doc.text('Client Info', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.text('Name: ' + (this.clientPrefix || '') + ' ' + (this.clientName || ''), 20, y);
    y += 8;
    doc.text('Email: ' + (this.clientEmail || ''), 20, y);
    y += 8;
    doc.text('Contact: ' + (this.clientContact || ''), 20, y);
    y += 8;
    doc.text('Location: ' + (this.clientLocation || ''), 20, y);
    y += 12;

    // Add more sections as needed
    doc.save('quotation.pdf');
  }
  showQuotationSummary: boolean = false;

  calculateTotalProjectCost(): number {
    // Example calculation, update as needed
    let total = 0;
    // Add up costs from plinth, super structure, floors, bore well, extra work, etc.
    // This is a placeholder, replace with your actual logic
    return total;
  }

  deleteFloor(index: number): void {
    if (this.floors && this.floors.length > index) {
      this.floors.splice(index, 1);
    }
  }

  deleteBoreWellItem(index: number): void {
    if (this.boreWellItems && this.boreWellItems.length > index) {
      this.boreWellItems.splice(index, 1);
    }
  }

  addBoreWellItem(): void {
    this.boreWellItems.push({ description: '', quantity: 0, rate: 0 });
  }

  get grandTotalBoreWell(): number {
    return this.boreWellItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
  }

  addExtraWorkItem(): void {
    this.extraWorkItems.push({ description: '', amount: 0, remarks: '' });
  }
  extraWorkItems: Array<{ description: string; amount?: number; remarks?: string }> = [
    { description: 'Inside Taza (plaster finishing)' },
    { description: 'Underground Sump / Water Tank' },
    { description: 'Boundary Wall & Main Gate' },
    { description: 'External Flooring' },
    { description: 'Septic Tank / Soak Pit' }
  ];
  isBoreWellRequired: boolean = false;

  toggleBoreWellCosting() {
    if (this.isBoreWellRequired) {
      this.showBoreWellCosting = !this.showBoreWellCosting;
    }
  }
  showBoreWellCosting: boolean = false;
  totalArea: number = 0;
  // ...existing code...
// Remove stray closing braces and fix resetBoreWellCosting

  showExtraWork: boolean = false;
  extraWorkDescription: string = '';
  extraWorkAmount: number | null = null;
  extraWorkRemarks: string = '';

  boreWellItems: Array<{ description: string; quantity: number; rate: number }> = [
     { description: 'Kesing PIPE ORIPLAST 80 SCHEDULE (5 inch)', quantity: 9, rate: 4200 },
     { description: 'Filter cutting', quantity: 3, rate: 500 },
     { description: 'Gravel (Tata Ace trip)', quantity: 2, rate: 6000 },
     { description: 'Mud powder', quantity: 6, rate: 450 },
     { description: 'VAT cutting', quantity: 1, rate: 500 },
     { description: 'Gadi fair', quantity: 1, rate: 1500 },
     { description: 'Washing (hr)', quantity: 2, rate: 2000 },
     { description: 'Soda / surf (chemicals)', quantity: 1, rate: 600 },
     { description: 'Master kesing 10" (10 ft length)', quantity: 1, rate: 3000 },
     { description: 'Kalyx boring cost (ft)', quantity: 150, rate: 105 }
  ];

  resetBoreWellCosting() {
    this.boreWellItems = [
      { description: 'Kesing PIPE ORIPLAST 80 SCHEDULE (5 inch)', quantity: 9, rate: 4200 }
    ];
  }
  // Payment Structure Section State
  showPaymentStructure: boolean = false;
  paymentScheduleCoreHouse = [
    { label: 'After completion 7ft wall', value: 30 },
    { label: 'Slab casting', value: 40 },
    { label: 'Inside plaster', value: 15 },
    { label: 'Outside plaster', value: 15 }
  ];
  paymentScheduleBuildingWork = [
    { label: 'Up to window level', value: 5 },
    { label: 'Nimtal (7 ft height)', value: 10 },
    { label: 'Roof beam level', value: 10 },
    { label: 'Roof slab casting', value: 15 },
    { label: 'Inside plaster', value: 5 },
    { label: 'WPC / Chaukath fitting', value: 5 },
    { label: 'Window / Door / Grill / SS work', value: 15 },
    { label: 'Tiles fitting', value: 10 },
    { label: 'Painting & finishing', value: 10 },
    { label: 'Plumbing fittings', value: 10 },
    { label: 'Final Payment (7 days after handover)', value: 5 }
  ];
  paymentSchedulePlinthWork = [
    { label: 'Material dump & start of construction', value: 30 },
    { label: 'Start of Dhalei (Casting Work)', value: 25 },
    { label: 'Outer brickwork of plinth', value: 15 },
    { label: 'Filling foundation', value: 10 },
    { label: 'Final plinth casting', value: 15 },
    { label: 'Completion of plinth (within 1 week)', value: 5 }
  ];
  paymentSchedulePiling = [
    { label: 'Material dumping & labour camp, starting of work', value: 50 },
    { label: 'After completion', value: 50 }
  ];

  resetPaymentStructure() {
    this.paymentScheduleCoreHouse = [
      { label: 'After completion 7ft wall', value: 30 },
      { label: 'Slab casting', value: 40 },
      { label: 'Inside plaster', value: 15 },
      { label: 'Outside plaster', value: 15 }
    ];
    this.paymentScheduleBuildingWork = [
      { label: 'Up to window level', value: 5 },
      { label: 'Nimtal (7 ft height)', value: 10 },
      { label: 'Roof beam level', value: 10 },
      { label: 'Roof slab casting', value: 15 },
      { label: 'Inside plaster', value: 5 },
      { label: 'WPC / Chaukath fitting', value: 5 },
      { label: 'Window / Door / Grill / SS work', value: 15 },
      { label: 'Tiles fitting', value: 10 },
      { label: 'Painting & finishing', value: 10 },
      { label: 'Plumbing fittings', value: 10 },
      { label: 'Final Payment (7 days after handover)', value: 5 }
    ];
    this.paymentSchedulePlinthWork = [
      { label: 'Material dump & start of construction', value: 30 },
      { label: 'Start of Dhalei (Casting Work)', value: 25 },
      { label: 'Outer brickwork of plinth', value: 15 },
      { label: 'Filling foundation', value: 10 },
      { label: 'Final plinth casting', value: 15 },
      { label: 'Completion of plinth (within 1 week)', value: 5 }
    ];
    this.paymentSchedulePiling = [
      { label: 'Material dumping & labour camp, starting of work', value: 50 },
      { label: 'After completion', value: 50 }
    ];
  }
  // Reset a dynamic floor's fields to defaults
  resetFloorInfo(index: number) {
    if (this.floors[index]) {
      this.floors[index] = {
        showInfo: true,
        brandedMaterial: 'Wall finish (Asian/Birla Putty), Premium Paint (Asian Paint + Weather Coat). Electrical: Finolex/Anchor/Havells. Flooring: Somany Tiles (4x2). Staircase: Marble. Inside doors: 30mm Ply waterproof. Main Door: Teak. Kitchen chimney: Branded. Chowkath: WPC (5”x2.5”). Windows: PVC with mosquito cover & glass. Plumbing: Oriplast/Supreme, Jaguar. Grills: GI. Balcony: SS. Kitchen slab: Granite',
        nonBrandedMaterial: 'Cement Chowkath, Color Putty (2 coats), Primer (1 coat), Paint (2 coats). Electrical: Finolex wire, module switch. Tiles (Non branded). Windows: Aluminium. Doors: Flush door 300mm laminated both sides. Tiles: Local 2x2. Plumbing: Supreme/Oriplast. Bathroom fittings: Parryware. MS Grill',
        baseSqft: 1500,
        coreHouseSqft: 0,
        coreHouseSqftPrice: 980,
        finishingSqft: 1500,
        finishingPriceType: 'branded',
        finishingPrice: 1650,
        superStructureSqftPrice: 0
      };
    }
  }
  finishingPriceType: 'branded' | 'nonbranded' = 'branded';
  finishingPrice: number = 1650;
  finishingBrandedPrice: number = 1650;
  finishingNonBrandedPrice: number = 1550;
  coreHouseSqftPrice: number = 1040;
  finishingSqftPrice: number = 0;
  // Called when user changes finishing type for main section
  onFinishingPriceTypeChange(type: 'branded' | 'nonbranded') {
    this.finishingPriceType = type;
    // Set default when type changes, but keep editable
    this.finishingPrice = (type === 'branded') ? 1650 : 1550;
  }
  showSuperStructureInfo: boolean = false;
    superStructureBrandedMaterial: string = '';
    superStructureNonBrandedMaterial: string = '';
  superStructureMaterial: string = `Wall finish (Asian/Birla Putty), Premium Paint (Asian Paint + Weather Coat). Electrical: Finolex/Anchor/Havells. Flooring: Somany Tiles (4x2). Staircase: Marble. Inside doors: 30mm Ply waterproof. Main Door: Teak. Kitchen chimney: Branded. Chowkath: WPC (5”x2.5”). Windows: PVC with mosquito cover & glass. Plumbing: Oriplast/Supreme, Jaguar. Grills: GI. Balcony: SS. Kitchen slab: Granite`;
    superStructureMaterial2: string = `Cement Chowkath, Color Putty (2 coats), Primer (1 coat), Paint (2 coats). Electrical: Finolex wire, module switch. Tiles (Non branded). Windows: Aluminium. Doors: Flush door 300mm laminated both sides. Tiles: Local 2x2. Plumbing: Supreme/Oriplast. Bathroom fittings: Parryware. MS Grill`;
  superStructureBaseSqft: number = 1500;
  superStructureSqftPrice: number = 0;
  coreHouseSqft: number = 0;
  finishingSqft: number = 1500;

    floors: Array<{
      showInfo: boolean;
      brandedMaterial: string;
      nonBrandedMaterial: string;
      baseSqft: number;
      coreHouseSqft: number;
      coreHouseSqftPrice: number;
      finishingSqft: number;
      finishingPriceType: string;
      finishingPrice: number;
      superStructureSqftPrice: number;
    }> = [];

    addFloor() {
      const floorIndex = this.floors.length;
      this.floors.push({
        showInfo: true,
        brandedMaterial: 'Wall finish (Asian/Birla Putty), Premium Paint (Asian Paint + Weather Coat). Electrical: Finolex/Anchor/Havells. Flooring: Somany Tiles (4x2). Staircase: Marble. Inside doors: 30mm Ply waterproof. Main Door: Teak. Kitchen chimney: Branded. Chowkath: WPC (5”x2.5”). Windows: PVC with mosquito cover & glass. Plumbing: Oriplast/Supreme, Jaguar. Grills: GI. Balcony: SS. Kitchen slab: Granite',
        nonBrandedMaterial: 'Cement Chowkath, Color Putty (2 coats), Primer (1 coat), Paint (2 coats). Electrical: Finolex wire, module switch. Tiles (Non branded). Windows: Aluminium. Doors: Flush door 300mm laminated both sides. Tiles: Local 2x2. Plumbing: Supreme/Oriplast. Bathroom fittings: Parryware. MS Grill',
        baseSqft: 1500,
        coreHouseSqft: 0,
        coreHouseSqftPrice: 980,
        finishingSqft: 1500,
        finishingPriceType: 'branded',
        finishingPrice: 1650,
        superStructureSqftPrice: 0
      });
    }
    // Handler for dynamic floor finishing price type change
    onFloorFinishingPriceTypeChange(index: number, type: string) {
      const floor = this.floors[index];
      if (!floor) return;
      // Cast type to 'branded' | 'nonbranded'
      const safeType: 'branded' | 'nonbranded' = (type === 'branded') ? 'branded' : 'nonbranded';
      floor.finishingPriceType = safeType;
      // Set default value when user switches type — user can still edit after this
      floor.finishingPrice = (safeType === 'branded') ? 1650 : 1550;
    }

    toggleFloorInfo(index: number) {
      this.floors[index].showInfo = !this.floors[index].showInfo;
    }

    onFloorCoreHouseSqftChange(index: number, value: number) {
      const floor = this.floors[index];
      floor.coreHouseSqft = Number(value) || 0;
      floor.finishingSqft = floor.baseSqft - floor.coreHouseSqft;
      if (floor.finishingSqft < 0) floor.finishingSqft = 0;
    }

  onSuperStructureBaseSqftChange(value: number) {
    this.superStructureBaseSqft = Number(value) || 0;
    // If coreHouseSqft is 0 or not set, finishing = base
    if (!this.coreHouseSqft) {
      this.finishingSqft = this.superStructureBaseSqft;
    } else {
      this.finishingSqft = this.superStructureBaseSqft - this.coreHouseSqft;
      if (this.finishingSqft < 0) this.finishingSqft = 0;
    }
  }

  onCoreHouseSqftChange(value: number) {
    this.coreHouseSqft = Number(value) || 0;
    this.finishingSqft = (Number(this.superStructureBaseSqft) || 0) - this.coreHouseSqft;
    if (this.finishingSqft < 0) this.finishingSqft = 0;
  }

  toggleSuperStructureInfo() {
    this.showSuperStructureInfo = !this.showSuperStructureInfo;
  }

  resetSuperStructureInfo() {
  this.superStructureMaterial = `Wall finish (Asian/Birla Putty), Premium Paint (Asian Paint + Weather Coat). Electrical: Finolex/Anchor/Havells. Flooring: Somany Tiles (4x2). Staircase: Marble. Inside doors: 30mm Ply waterproof. Main Door: Teak. Kitchen chimney: Branded. Chowkath: WPC (5”x2.5”). Windows: PVC with mosquito cover & glass. Plumbing: Oriplast/Supreme, Jaguar. Grills: GI. Balcony: SS. Kitchen slab: Granite`;
  this.superStructureMaterial2 = `Cement Chowkath, Color Putty (2 coats), Primer (1 coat), Paint (2 coats). Electrical: Finolex wire, module switch. Tiles (Non branded). Windows: Aluminium. Doors: Flush door 300mm laminated both sides. Tiles: Local 2x2. Plumbing: Supreme/Oriplast. Bathroom fittings: Parryware. MS Grill`;
  this.superStructureBaseSqft = 1500;
  this.superStructureSqftPrice = 0;
  this.coreHouseSqft = 0;
  this.coreHouseSqftPrice = 1040;
  this.finishingSqft = 1500;
  this.finishingPriceType = 'branded';
  this.finishingPrice = 1650;
  }
  pillingMaterial: string = 'Tata Tiscon Rods, Ultratech Super Cement, Black Stone, Quality Sand';
  plinthMaterial: string = 'Tata Tiscon Rod, Ultratech Cement, Black Stone, Quality Sand, Fly Ash Bricks';
  isPillingRequired: boolean = false;
  plinthBaseSqft: number = 1500;
  plinthSqftPrice: number = 650;
  clientName: string = '';
  clientEmail: string = '';
  clientContact: string = '';
  clientLocation: string = '';
  showPlinthInfo = false;
  plinthType: string = '';
  plinthDepth: number = 0;
  plinthCount: number = 0;
  plinthPrice: number = 0;

  togglePlinthInfo() {
    this.showPlinthInfo = !this.showPlinthInfo;
  }

  resetPlinthInfo() {
    this.plinthBaseSqft = 1500;
    this.plinthSqftPrice = 650;
  }
  clientPrefix: string = 'Mr';
  showCompanyInfo = false;
  showClientInfo = false;

  // Pilling Foundation state
  showPillingInfo = false;
  pileType: string = '';
    pileDepth: number = 19.685; // Default to 19.685 feet
    pileCount: number = 1; // Initialize to a non-null number
    pilePrice: number = 600; // Initialize to a non-null number

    // Ensure all are always numbers
  // ngOnInit for extraWorkItems initialization is kept below. Remove this duplicate.

  togglePillingInfo() {
    this.showPillingInfo = !this.showPillingInfo;
  }

  resetPillingInfo() {
    this.pileType = '';
    this.pileDepth = 19.685;
    this.pileCount = 1;
    this.pilePrice = 600;
  }

  companyName: string = 'NextGEN Infra';
  companyAddress: string = 'GA-48, Niladri Vihar, Near Buddha Park, Bhubaneswar – 751021';
  companyMobile: string = '+91-9861104499 / +91-9702160068';

  toggleCompanyInfo() {
    this.showCompanyInfo = !this.showCompanyInfo;
  }

  toggleClientInfo() {
    this.showClientInfo = !this.showClientInfo;
  }
  resetClientInfo() {
    this.clientPrefix = 'Mr';
    this.name = '';
    this.email = '';
    this.contact = '';
    this.location = '';
  }

  resetCompanyInfo() {
    this.companyName = 'NextGEN Infra';
    this.companyAddress = 'GA-48, Niladri Vihar, Near Buddha Park, Bhubaneswar – 751021';
    this.companyMobile = '+91-9861104499 / +91-9702160068';
  }
  title = 'InstantCostEstimator';
    // name and location are already defined below, so do not redeclare here
    totalEstimate = 2500; // Example, replace with actual data source

  async downloadPDF() {
    const estimateSection = document.querySelector('.estimate-section') as HTMLElement;
    if (!estimateSection) return;

    // Hide the start/new buttons or anything you don't want in PDF
    const excludeBtn = document.querySelector('.exclude-pdf') as HTMLElement | null;
    let originalDisplay = '';
    if (excludeBtn) {
      originalDisplay = excludeBtn.style.display;
      excludeBtn.style.display = 'none';
    }

    try {
      // capture once
      const canvas = await html2canvas(estimateSection, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });

      // page size in px used by jsPDF (since unit is 'px')
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // scale image to fit page width (preserve aspect ratio)
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const renderedWidth = imgWidth * ratio;
      const renderedHeight = imgHeight * ratio;

      // If content fits one page, just add. If taller, split into multiple pages.
      if (renderedHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, renderedWidth, renderedHeight);
      } else {
        // For tall content, draw a full-page scaled image repeatedly with Y offset
        let remainingHeight = imgHeight;
        let srcY = 0;
        const pxPerPage = Math.round(pageHeight / ratio); // source pixels that fill one PDF page
        while (remainingHeight > 0) {
          // create a temporary canvas for the slice
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgWidth;
          sliceCanvas.height = Math.min(pxPerPage, remainingHeight);
          const ctx = sliceCanvas.getContext('2d')!;
          // draw the relevant slice from original canvas
          ctx.drawImage(canvas, 0, srcY, imgWidth, sliceCanvas.height, 0, 0, imgWidth, sliceCanvas.height);
          const sliceData = sliceCanvas.toDataURL('image/png');

          // compute scaled height for this slice
          const sliceRenderedHeight = sliceCanvas.height * ratio;
          pdf.addImage(sliceData, 'PNG', 0, 0, renderedWidth, sliceRenderedHeight);

          remainingHeight -= sliceCanvas.height;
          srcY += sliceCanvas.height;

          if (remainingHeight > 0) pdf.addPage();
        }
      }

      // restore hidden button
      if (excludeBtn) {
        excludeBtn.style.display = originalDisplay;
      }

      const safeName = (this.name || 'Client').replace(/\s+/g, '_');
      const safeLocation = (this.location || 'Location').replace(/\s+/g, '_');
      const filename = `${safeName}_${this.totalArea || 0}_${safeLocation}.pdf`;
      pdf.save(filename);

    } catch (err) {
      // restore button display on error as well
      if (excludeBtn) {
        excludeBtn.style.display = originalDisplay;
      }
      console.error('Error generating PDF', err);
    }
  }

  // Form state
  step = 1;
  buildingType = '';
  floorsInput: { floor: string, area: number | null }[] = [ { floor: '', area: null } ];
  name = '';
  email = '';
  contact = '';
  location = '';

  // ...existing code...
  initialExtraWorkItems: string[] = [
  'Inside Taza plaster',
  'Underground sump',
  'Boundary wall & main gate',
  'External flooring',
  'Septic tank/soak pit',
  'Parapet & gridding',
  'Head room'
  ];


  // Merged into main ngOnInit above

  resetExtraWork() {
    this.extraWorkItems = this.initialExtraWorkItems.map(desc => ({ description: desc }));
  }

  deleteExtraWorkItem(index: number) {
    this.extraWorkItems.splice(index, 1);
  }
  // Expand/collapse all logic (add Payment Structure)
  expandAll() {
    this.showCompanyInfo = true;
    this.showClientInfo = true;
    this.showPillingInfo = true;
    this.showPlinthInfo = true;
    this.showSuperStructureInfo = true;
    this.showPaymentStructure = true;
    this.showExtraWork = true;
    this.showBoreWellCosting = true;
  }
  collapseAll() {
    this.showCompanyInfo = false;
    this.showClientInfo = false;
    this.showPillingInfo = false;
    this.showPlinthInfo = false;
    this.showSuperStructureInfo = false;
    this.showPaymentStructure = false;
    this.showExtraWork = false;
    this.showBoreWellCosting = false;
  }
}
