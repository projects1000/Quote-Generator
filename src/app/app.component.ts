import { Component, OnInit } from '@angular/core';
import { PdfGeneratorService } from './pdf-generator.service';

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
  constructor(private pdfGeneratorService: PdfGeneratorService) {}

  ngOnInit(): void {
    // Load logo from localStorage if available
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      this.logoUrl = savedLogo;
    }
    // Load saved company info from localStorage if available
    try {
      const savedCompanyInfo = localStorage.getItem('companyInfo');
      if (savedCompanyInfo) {
        const parsed = JSON.parse(savedCompanyInfo);
        this.companyName = parsed.companyName || '';
        this.companyAddress = parsed.companyAddress || '';
        this.companyMobile = parsed.companyMobile || '';
        // Mark saved so Save button starts disabled
        this.companyInfoSaved = true;
      }
      const savedSS = localStorage.getItem('superStructureInfo');
      if (savedSS) {
        const ss = JSON.parse(savedSS);
        this.superStructureMaterial = ss.superStructureMaterial || this.superStructureMaterial;
        this.superStructureMaterial2 = ss.superStructureMaterial2 || this.superStructureMaterial2;
        this.superStructureBaseSqft = typeof ss.superStructureBaseSqft === 'number' ? ss.superStructureBaseSqft : this.superStructureBaseSqft;
        this.coreHouseSqft = typeof ss.coreHouseSqft === 'number' ? ss.coreHouseSqft : this.coreHouseSqft;
        this.coreHouseSqftPrice = typeof ss.coreHouseSqftPrice === 'number' ? ss.coreHouseSqftPrice : this.coreHouseSqftPrice;
        this.finishingSqft = typeof ss.finishingSqft === 'number' ? ss.finishingSqft : this.finishingSqft;
        this.finishingPriceType = ss.finishingPriceType || this.finishingPriceType;
        this.finishingPrice = typeof ss.finishingPrice === 'number' ? ss.finishingPrice : this.finishingPrice;
        this.superStructureSaved = true;
      }
        const savedPilling = localStorage.getItem('pillingInfo');
        if (savedPilling) {
          const p = JSON.parse(savedPilling);
          this.isPillingRequired = !!p.isPillingRequired;
          this.pillingMaterial = p.pillingMaterial || this.pillingMaterial;
          this.pileType = p.pileType || this.pileType;
          this.pileDepth = typeof p.pileDepth === 'number' ? p.pileDepth : this.pileDepth;
          this.pileCount = typeof p.pileCount === 'number' ? p.pileCount : this.pileCount;
          this.pilePrice = typeof p.pilePrice === 'number' ? p.pilePrice : this.pilePrice;
          this.pillingInfoSaved = true;
        }
        const savedPlinth = localStorage.getItem('plinthInfo');
        if (savedPlinth) {
          const pl = JSON.parse(savedPlinth);
          this.showPlinthInfo = !!pl.showPlinthInfo;
          this.plinthMaterial = pl.plinthMaterial || this.plinthMaterial;
          this.plinthBaseSqft = typeof pl.plinthBaseSqft === 'number' ? pl.plinthBaseSqft : this.plinthBaseSqft;
          this.plinthSqftPrice = typeof pl.plinthSqftPrice === 'number' ? pl.plinthSqftPrice : this.plinthSqftPrice;
          this.plinthType = pl.plinthType || this.plinthType;
          this.plinthDepth = typeof pl.plinthDepth === 'number' ? pl.plinthDepth : this.plinthDepth;
          this.plinthCount = typeof pl.plinthCount === 'number' ? pl.plinthCount : this.plinthCount;
          this.plinthPrice = typeof pl.plinthPrice === 'number' ? pl.plinthPrice : this.plinthPrice;
          this.plinthInfoSaved = true;
        }
        const savedPayment = localStorage.getItem('paymentStructure');
        if (savedPayment) {
          const ps = JSON.parse(savedPayment);
          this.paymentScheduleCoreHouse = ps.coreHouse || this.paymentScheduleCoreHouse;
          this.paymentScheduleBuildingWork = ps.building || this.paymentScheduleBuildingWork;
          this.paymentSchedulePlinthWork = ps.plinth || this.paymentSchedulePlinthWork;
          this.paymentSchedulePiling = ps.piling || this.paymentSchedulePiling;
          this.paymentStructureSaved = true;
        }
        const savedExtra = localStorage.getItem('extraWorkItems');
        if (savedExtra) {
          const arr = JSON.parse(savedExtra);
          if (Array.isArray(arr)) {
            this.extraWorkItems = arr;
            this.extraWorkSaved = true;
          }
        }
    } catch (e) {
      console.warn('Failed to parse saved company info from localStorage:', e);
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
    // Prepare sections for PDF
    const sections: Array<{ heading: string; items: string[] }> = [];
    // Prepare cost breakdown numbers
    const pillingCost = (this.isPillingRequired ? (Number(this.pileDepth) || 0) * (Number(this.pileCount) || 0) * (Number(this.pilePrice) || 0) : 0);
    const plinthSqft = Number(this.plinthBaseSqft) || 0;
    const plinthRate = Number(this.plinthSqftPrice) || 0;
    const plinthTotal = plinthSqft * plinthRate;
    // Super Structure total should include Ground Floor (main section) + all dynamic floors
    const mainCoreSqft = Number(this.coreHouseSqft) || 0;
    const mainCoreRate = Number(this.coreHouseSqftPrice) || 0;
    const mainFinishSqft = Number(this.finishingSqft) || 0;
    const mainFinishRate = Number(this.finishingPrice) || 0;
    const mainSuperCost = (mainCoreSqft * mainCoreRate) + (mainFinishSqft * mainFinishRate);

    let floorsSuperCost = 0;
    if (this.floors && this.floors.length > 0) {
      for (const f of this.floors) {
        const coreSqft = Number(f.coreHouseSqft) || 0;
        const coreRate = Number(f.coreHouseSqftPrice) || 0;
        const finishSqft = Number(f.finishingSqft) || 0;
        const finishRate = Number(f.finishingPrice) || 0;
        floorsSuperCost += coreSqft * coreRate + finishSqft * finishRate;
      }
    }
    const superStructureCost = mainSuperCost + floorsSuperCost;
    const includeBoreWell = this.isBoreWellRequired || this.showBoreWellCosting;
    const boreWellCost = includeBoreWell ? (this.boreWellItems || []).reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0) : 0;
    const extraWorkCost = (this.extraWorkItems || []).reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    // Pilling Quotation (if admin selects checkbox)
    if (this.isPillingRequired) {
      const totalPillingCost = (this.pileDepth || 0) * (this.pileCount || 0) * (this.pilePrice || 0);
      sections.push({
        heading: 'Pilling Quotation',
        items: [
          `Material Information: ${this.pillingMaterial}`,
          `Pile Type: ${this.pileType}`,
          `Pile Depth: ${this.pileDepth && this.pileDepth > 0 ? (this.pileDepth + ' ft') : 'to be discussed with client'}`,
          `Number of Piles: ${this.pileCount}`,
          `Price Per Feet (Rs.): Rs. ${this.pilePrice}`,
          `Total Cost: Rs. ${totalPillingCost}`
        ]
      });
    }
    // Plinth/Foundation Work
    if (this.showPlinthInfo) {
      const plinthSqft = Number(this.plinthBaseSqft) || 0;
      const plinthRate = Number(this.plinthSqftPrice) || 0; // e.g., 650 per sqft
      const plinthTotal = plinthSqft * plinthRate;
      sections.push({
        heading: 'Plinth/Foundation Work',
        items: [
          `Type: ${this.plinthType}`,
          `Depth: ${this.plinthDepth && this.plinthDepth > 0 ? (this.plinthDepth + ' ft') : 'to be discussed with client'}`,
          `Count: ${this.plinthCount}`,
          `Rate (per sqft): Rs. ${plinthRate}`,
          `Base Sqft: ${plinthSqft}`,
          `Total Cost: Rs. ${plinthTotal}`,
          `Material: ${this.plinthMaterial}`
        ]
      });
    }
  // Super Structure (show one material set based on selected finishing type)
  if (this.showSuperStructureInfo) {
      const coreSqft = Number(this.coreHouseSqft) || 0;
      const coreRate = Number(this.coreHouseSqftPrice) || 0;
      const finishSqft = Number(this.finishingSqft) || 0;
      const finishRate = Number(this.finishingPrice) || 0;
      const brandedText = this.superStructureMaterial || '';
      const nonBrandedText = this.superStructureMaterial2 || '';
      const superItems: string[] = [
        ...(this.finishingPriceType === 'nonbranded'
          ? [`Non Branded Material: ${nonBrandedText}`]
          : [`Branded Material: ${brandedText}`]
        ),
        `Total Base Part size in Sq ft: ${this.superStructureBaseSqft}`
      ];
      if (coreSqft > 0) {
        const coreValue = coreRate > 0 ? `${coreSqft} Sq ft at Rs. ${coreRate} / Sq ft` : `${coreSqft} Sq ft`;
        superItems.push(`Core House: ${coreValue}`);
      }
      if (finishSqft > 0) {
        const finRateText = finishRate > 0 ? ` at Rs. ${finishRate} / Sq ft` : '';
        const finTypeText = this.finishingPriceType ? ` (${this.finishingPriceType})` : '';
        superItems.push(`Finishing: ${finishSqft} Sq ft${finRateText}${finTypeText}`);
      }
      const totalMain = (coreSqft * coreRate) + (finishSqft * finishRate);
      superItems.push(`Total Cost: Rs. ${totalMain}`);
      // Add a grouping heading first (renderer skips its table)
      sections.push({ heading: 'Super Structure', items: superItems });
      // Then add Ground Floor as its own detailed section so floors start from First/Second in PDF
      sections.push({ heading: 'Ground Floor', items: superItems });
    }

    // Per-floor detailed tables (always render if floors exist)
    const floorName = (idx: number) => {
      // Floors list in UI starts from 1st Floor; index 0 => First, 1 => Second, etc.
      const names = ['First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor'];
      return names[idx] || `Floor ${idx + 1}`;
    };
    if (this.floors && this.floors.length > 0) {
      this.floors.forEach((f, i) => {
        const coreSqft = Number(f.coreHouseSqft) || 0;
        const coreRate = Number(f.coreHouseSqftPrice) || 0;
        const finishSqft = Number(f.finishingSqft) || 0;
        const finishRate = Number(f.finishingPrice) || 0;
        const coreCost = coreSqft * coreRate;
        const finishCost = finishSqft * finishRate;
        const total = coreCost + finishCost;

        const brandedText = f.brandedMaterial || this.superStructureMaterial;
        const nonBrandedText = f.nonBrandedMaterial || this.superStructureMaterial2;

        const floorItems: string[] = [
          ...(f.finishingPriceType === 'nonbranded'
            ? [`Non Branded Material: ${nonBrandedText}`]
            : [`Branded Material: ${brandedText}`]
          ),
          `Total Base Part size in Sq ft: ${f.baseSqft}`
        ];

        // Core house details only if size > 0, combine size and rate on single line
        if (coreSqft > 0) {
          const coreValue = coreRate > 0 ? `${coreSqft} Sq ft at Rs. ${coreRate} / Sq ft` : `${coreSqft} Sq ft`;
          floorItems.push(`Core House: ${coreValue}`);
        }

        // Finishing details only if size > 0, combine size and rate on single line
        if (finishSqft > 0) {
          const finRateText = finishRate > 0 ? ` at Rs. ${finishRate} / Sq ft` : '';
          const finTypeText = f.finishingPriceType ? ` (${f.finishingPriceType})` : '';
          floorItems.push(`Finishing: ${finishSqft} Sq ft${finRateText}${finTypeText}`);
        }

        floorItems.push(`Total Cost: Rs. ${total}`);
        sections.push({ heading: floorName(i), items: floorItems });
      });
    }
    // Bore Well Costing
    if (this.showBoreWellCosting) {
  const boreItems = this.boreWellItems.map(b => `${b.description}: Qty ${b.quantity}, Rate Rs.${b.rate}`);
      sections.push({ heading: 'Bore Well Costing', items: boreItems });
    }

    // Cost Breakdown section for clarity
    sections.push({
      heading: 'Cost Breakdown',
      items: [
        `Pilling: Rs. ${pillingCost}`,
        `Plinth/Foundation: Rs. ${plinthTotal}`,
        `Super Structure: Rs. ${superStructureCost}`,
        `Bore Well: Rs. ${boreWellCost}`,
        `Extra Work: Rs. ${extraWorkCost}`
      ]
    });

    // Append Payment Structure and Extra Work at the bottom of the PDF (conditionally include by relevance)
    const coreHousePayments = this.paymentScheduleCoreHouse.map(s => `${s.label}: ${s.value}%`);
    const buildingWorkPayments = this.paymentScheduleBuildingWork.map(s => `${s.label}: ${s.value}%`);
    const plinthWorkPayments = this.paymentSchedulePlinthWork.map(s => `${s.label}: ${s.value}%`);
    const pilingPayments = this.paymentSchedulePiling.map(s => `${s.label}: ${s.value}%`);
    // Only include Core House schedule if any core house sqft is selected (main or any floor)
    const hasAnyCoreHouse = (Number(this.coreHouseSqft) || 0) > 0 || (this.floors || []).some(f => (Number(f.coreHouseSqft) || 0) > 0);
    if (coreHousePayments.length && hasAnyCoreHouse) {
      sections.push({ heading: 'Payment Schedule - Core House', items: coreHousePayments });
    }
    if (buildingWorkPayments.length) sections.push({ heading: 'Payment Schedule - Building Work', items: buildingWorkPayments });
    if (plinthWorkPayments.length) sections.push({ heading: 'Payment Schedule - Plinth Work', items: plinthWorkPayments });
    // Only include Piling payment schedule if pilling is required
    if (pilingPayments.length && this.isPillingRequired) {
      sections.push({ heading: 'Payment Schedule - Piling', items: pilingPayments });
    }

    if (this.extraWorkItems && this.extraWorkItems.length) {
      const extraItems = this.extraWorkItems.map(e => `${e.description}${e.amount ? ' - Rs. ' + e.amount : ''}${e.remarks ? ' (' + e.remarks + ')' : ''}`);
      sections.push({ heading: 'Extra Work (Not Included in payment structure, To be discussed With Client)', items: extraItems });
    }

    // Use injected PdfGeneratorService
    this.pdfGeneratorService.generateQuotationPDF({
      companyName: this.companyName,
      companyAddress: this.companyAddress,
      companyMobile: this.companyMobile,
      clientPrefix: this.clientPrefix,
      clientName: this.clientName,
      clientEmail: this.clientEmail,
      clientContact: this.clientContact,
      clientLocation: this.clientLocation,
  logoUrl: this.logoUrl ?? undefined,
      sections,
      totalCost: this.calculateTotalProjectCost(),
      // Let floors flow naturally onto pages (no forced break before First Floor) but
      // keep the option available for future. For compactness we leave it off here.
      options: {
        newPageBeforeFloorSections: false
      }
    });
  }
  showQuotationSummary: boolean = false;

  calculateTotalProjectCost(): number {
    // Pilling
    const pillingCost = (this.isPillingRequired ? (Number(this.pileDepth) || 0) * (Number(this.pileCount) || 0) * (Number(this.pilePrice) || 0) : 0);

    // Plinth / Foundation
    const plinthSqft = Number(this.plinthBaseSqft) || 0;
    const plinthRate = Number(this.plinthSqftPrice) || 0; // default 650 per sq ft
    const plinthCost = plinthSqft * plinthRate;

    // Super Structure / Floors
    // Super Structure total: Ground (main section) + all dynamic floors
    const mainCoreSqft2 = Number(this.coreHouseSqft) || 0;
    const mainCoreRate2 = Number(this.coreHouseSqftPrice) || 0;
    const mainFinishSqft2 = Number(this.finishingSqft) || 0;
    const mainFinishRate2 = Number(this.finishingPrice) || 0;
    const mainSuperCost2 = (mainCoreSqft2 * mainCoreRate2) + (mainFinishSqft2 * mainFinishRate2);

    let floorsSuperCost2 = 0;
    if (this.floors && this.floors.length > 0) {
      for (const f of this.floors) {
        const coreSqft = Number(f.coreHouseSqft) || 0;
        const coreRate = Number(f.coreHouseSqftPrice) || 0;
        const finishSqft = Number(f.finishingSqft) || 0;
        const finishRate = Number(f.finishingPrice) || 0;
        floorsSuperCost2 += coreSqft * coreRate + finishSqft * finishRate;
      }
    }
    const superStructureCost = mainSuperCost2 + floorsSuperCost2;

    // Bore Well
    const includeBoreWell = this.isBoreWellRequired || this.showBoreWellCosting;
    const boreWellCost = includeBoreWell ? (this.boreWellItems || []).reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0) : 0;

    // Extra Work
    const extraWorkCost = (this.extraWorkItems || []).reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const total = pillingCost + plinthCost + superStructureCost + boreWellCost + extraWorkCost;
    return Math.max(0, Math.round(total));
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
    this.extraWorkSaved = false;
    this.showExtraWorkSaved = false;
  }
  extraWorkItems: Array<{ description: string; amount?: number; remarks?: string }> = [
    { description: 'Inside Taza (plaster finishing)' },
    { description: 'Underground Sump / Water Tank' },
    { description: 'Boundary Wall & Main Gate' },
    { description: 'External Flooring' },
    { description: 'Septic Tank / Soak Pit/ Parapit/ Gridding /Headroom' }
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
  // Saved state flags
  superStructureSaved: boolean = false;
  showSuperStructureSaved: boolean = false;

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
    this.paymentStructureSaved = false;
    this.showPaymentStructureSaved = false;
  }
  savePaymentStructure() {
    const payload = {
      coreHouse: this.paymentScheduleCoreHouse,
      building: this.paymentScheduleBuildingWork,
      plinth: this.paymentSchedulePlinthWork,
      piling: this.paymentSchedulePiling
    };
    localStorage.setItem('paymentStructure', JSON.stringify(payload));
    this.paymentStructureSaved = true;
    this.showPaymentStructureSaved = true;
    setTimeout(() => (this.showPaymentStructureSaved = false), 2000);
  }
  clearSavedPaymentStructure() {
    localStorage.removeItem('paymentStructure');
    this.resetPaymentStructure();
  }
  // Reset a dynamic floor's fields to defaults
  resetFloorInfo(index: number) {
    if (this.floors[index]) {
      this.floors[index] = {
        showInfo: true,
        brandedMaterial: 'Wall finish (Asian/Birla Putty), Premium Paint (Asian Paint + Weather Coat). Electrical: Finolex/Anchor/Havells. Flooring: Somany Tiles (4x2). Staircase: Marble. Inside doors: 30mm Ply waterproof. Main Door: Teak. Kitchen chimney: Branded. Chowkath: WPC (5”x2.5”). Windows: PVC with mosquito cover & glass. Plumbing: Oriplast/Supreme, Jaguar. Grills: GI. Balcony: SS. Kitchen slab: Granite',
        nonBrandedMaterial: 'Cement Chowkath, Color Putty (2 coats), Primer (1 coat), Paint (2 coats). Electrical: Finolex wire, module switch. Tiles (Non branded). Windows: Aluminium. Doors: Flush door 300mm laminated both sides. Tiles: Local 2x2. Plumbing: Supreme/Oriplast. Bathroom fittings: Parryware. MS Grill',
        baseSqft: this.plinthBaseSqft || 0,
        coreHouseSqft: 0,
        coreHouseSqftPrice: 980,
        finishingSqft: this.plinthBaseSqft || 0,
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
        baseSqft: this.plinthBaseSqft || 0,
        coreHouseSqft: 0,
        coreHouseSqftPrice: 980,
        finishingSqft: this.plinthBaseSqft || 0,
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
      if (!floor) return;
      const base = Number(floor.baseSqft) || 0;
      floor.coreHouseSqft = Math.max(0, Math.min(Number(value) || 0, base));
      floor.finishingSqft = Math.max(0, base - floor.coreHouseSqft);
    }

    onFloorBaseSqftChange(index: number, value: number) {
      const floor = this.floors[index];
      if (!floor) return;
      floor.baseSqft = Number(value) || 0;
      const base = floor.baseSqft;
      floor.coreHouseSqft = Math.max(0, Math.min(Number(floor.coreHouseSqft) || 0, base));
      floor.finishingSqft = Math.max(0, base - floor.coreHouseSqft);
    }

    enforceFloorBounds(index: number) {
      const floor = this.floors[index];
      if (!floor) return;
      const base = Number(floor.baseSqft) || 0;
      floor.coreHouseSqft = Math.max(0, Math.min(Number(floor.coreHouseSqft) || 0, base));
      floor.finishingSqft = Math.max(0, base - (Number(floor.coreHouseSqft) || 0));
    }

  onSuperStructureBaseSqftChange(value: number) {
    this.superStructureBaseSqft = Number(value) || 0;
    const base = this.superStructureBaseSqft || 0;
    // Clamp core within [0, base] and recompute finishing so sum <= base
    this.coreHouseSqft = Math.max(0, Math.min(Number(this.coreHouseSqft) || 0, base));
    this.finishingSqft = Math.max(0, base - this.coreHouseSqft);
  }

  onCoreHouseSqftChange(value: number) {
    const base = Number(this.superStructureBaseSqft) || 0;
    this.coreHouseSqft = Math.max(0, Math.min(Number(value) || 0, base));
    this.finishingSqft = Math.max(0, base - this.coreHouseSqft);
  }

  // Ensure sum equals base on blur/tab for super structure inputs
  enforceSuperStructureBounds() {
    const base = Number(this.superStructureBaseSqft) || 0;
    this.coreHouseSqft = Math.max(0, Math.min(Number(this.coreHouseSqft) || 0, base));
    this.finishingSqft = Math.max(0, base - (this.coreHouseSqft || 0));
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
  this.superStructureSaved = false;
  this.showSuperStructureSaved = false;
  }
  saveSuperStructure() {
    const payload = {
      superStructureMaterial: this.superStructureMaterial || '',
      superStructureMaterial2: this.superStructureMaterial2 || '',
      superStructureBaseSqft: this.superStructureBaseSqft || 0,
      coreHouseSqft: this.coreHouseSqft || 0,
      coreHouseSqftPrice: this.coreHouseSqftPrice || 0,
      finishingSqft: this.finishingSqft || 0,
      finishingPriceType: this.finishingPriceType || 'branded',
      finishingPrice: this.finishingPrice || 0
    };
    localStorage.setItem('superStructureInfo', JSON.stringify(payload));
    this.superStructureSaved = true;
    this.showSuperStructureSaved = true;
    setTimeout(() => (this.showSuperStructureSaved = false), 2000);
  }
  clearSavedSuperStructure() {
    localStorage.removeItem('superStructureInfo');
    this.resetSuperStructureInfo();
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
    this.plinthInfoSaved = false;
    this.showPlinthInfoSaved = false;
  }
  // When Plinth base changes, reflect it to Super Structure (Ground) and all Floors
  onPlinthBaseSqftChange(value: number) {
    const newBase = Math.max(0, Number(value) || 0);
    this.plinthBaseSqft = newBase;
    // Update Ground (Super Structure)
    this.superStructureBaseSqft = newBase;
    const base = this.superStructureBaseSqft || 0;
    this.coreHouseSqft = Math.max(0, Math.min(Number(this.coreHouseSqft) || 0, base));
    this.finishingSqft = Math.max(0, base - this.coreHouseSqft);
    // Update all floors
    (this.floors || []).forEach(f => {
      f.baseSqft = newBase;
      const fb = f.baseSqft || 0;
      f.coreHouseSqft = Math.max(0, Math.min(Number(f.coreHouseSqft) || 0, fb));
      f.finishingSqft = Math.max(0, fb - (Number(f.coreHouseSqft) || 0));
    });
  }
  savePlinthInfo() {
    const payload = {
      showPlinthInfo: !!this.showPlinthInfo,
      plinthMaterial: this.plinthMaterial || '',
      plinthBaseSqft: this.plinthBaseSqft || 0,
      plinthSqftPrice: this.plinthSqftPrice || 0,
      plinthType: this.plinthType || '',
      plinthDepth: this.plinthDepth || 0,
      plinthCount: this.plinthCount || 0,
      plinthPrice: this.plinthPrice || 0
    };
    localStorage.setItem('plinthInfo', JSON.stringify(payload));
    this.plinthInfoSaved = true;
    this.showPlinthInfoSaved = true;
    setTimeout(() => (this.showPlinthInfoSaved = false), 2000);
  }
  clearSavedPlinthInfo() {
    localStorage.removeItem('plinthInfo');
    this.resetPlinthInfo();
  }
  clientPrefix: string = 'Mr';
  showCompanyInfo = false;
  showClientInfo = false;
  // Company info save state & notification flags
  companyInfoSaved: boolean = false;
  showCompanyInfoSaved: boolean = false;
  // Pilling save state & notification
  pillingInfoSaved: boolean = false;
  showPillingInfoSaved: boolean = false;
  // Plinth save state & notification
  plinthInfoSaved: boolean = false;
  showPlinthInfoSaved: boolean = false;
  // Payment structure save state & notification
  paymentStructureSaved: boolean = false;
  showPaymentStructureSaved: boolean = false;
  // Extra work save state & notification
  extraWorkSaved: boolean = false;
  showExtraWorkSaved: boolean = false;

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
    this.pillingInfoSaved = false;
    this.showPillingInfoSaved = false;
  }
  savePillingInfo() {
    const payload = {
      isPillingRequired: !!this.isPillingRequired,
      pillingMaterial: this.pillingMaterial || '',
      pileType: this.pileType || '',
      pileDepth: this.pileDepth || 0,
      pileCount: this.pileCount || 0,
      pilePrice: this.pilePrice || 0
    };
    localStorage.setItem('pillingInfo', JSON.stringify(payload));
    this.pillingInfoSaved = true;
    this.showPillingInfoSaved = true;
    setTimeout(() => (this.showPillingInfoSaved = false), 2000);
  }
  clearSavedPillingInfo() {
    localStorage.removeItem('pillingInfo');
    this.resetPillingInfo();
  }

  companyName: string = '';
  companyAddress: string = '';
  companyMobile: string = '';

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
    this.companyName = '';
    this.companyAddress = '';
    this.companyMobile = '';
    // Re-enable Save and hide any prior saved notification
    this.companyInfoSaved = false;
    this.showCompanyInfoSaved = false;
  }
  
  saveCompanyInfo() {
    const payload = {
      companyName: this.companyName || '',
      companyAddress: this.companyAddress || '',
      companyMobile: this.companyMobile || ''
    };
    localStorage.setItem('companyInfo', JSON.stringify(payload));
    // Disable Save and show brief "Saved" notice
    this.companyInfoSaved = true;
    this.showCompanyInfoSaved = true;
    setTimeout(() => {
      this.showCompanyInfoSaved = false;
    }, 2000);
  }

  clearSavedCompanyInfo() {
    localStorage.removeItem('companyInfo');
    this.resetCompanyInfo();
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
    this.extraWorkSaved = false;
    this.showExtraWorkSaved = false;
  }

  deleteExtraWorkItem(index: number) {
    this.extraWorkItems.splice(index, 1);
    this.extraWorkSaved = false;
    this.showExtraWorkSaved = false;
  }
  onExtraWorkChanged() {
    this.extraWorkSaved = false;
    this.showExtraWorkSaved = false;
  }
  saveExtraWork() {
    localStorage.setItem('extraWorkItems', JSON.stringify(this.extraWorkItems || []));
    this.extraWorkSaved = true;
    this.showExtraWorkSaved = true;
    setTimeout(() => (this.showExtraWorkSaved = false), 2000);
  }
  clearSavedExtraWork() {
    localStorage.removeItem('extraWorkItems');
    this.resetExtraWork();
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
