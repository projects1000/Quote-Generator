import { Component } from '@angular/core';

interface Floor {
  plotSizeSqft: number;
  coreHouseSqft: number;
  finishingHouseSqft: number;
}

@Component({
  selector: 'app-nextgen-quote-calculator',
  template: `
    <div class="ngq-root">
      <h2 class="ngq-heading">NextGEN Infra Quote Calculator</h2>
      <div class="ngq-section">
        <label class="ngq-label">Total Ground Floor Plot Size</label>
        <input type="number" [(ngModel)]="ground.plotSizeSqft" (input)="onFloorPlotChange(ground)" class="ngq-input" min="0" />
      </div>
      <div class="ngq-subfields">
        <div>
          <label>Core house</label>
          <input type="number" [(ngModel)]="ground.coreHouseSqft" class="ngq-input" min="0" />
        </div>
        <div>
          <label>Finishing house</label>
          <input type="number" [value]="ground.finishingHouseSqft" class="ngq-input" readonly />
        </div>
      </div>
      <div *ngFor="let floor of floors; let i = index" class="ngq-floor">
        <div class="ngq-section">
          <label class="ngq-label">{{i+1}}<sup>{{i==0?'st':i==1?'nd':i==2?'rd':'th'}}</sup> Floor Plot Size</label>
          <input type="number" [(ngModel)]="floor.plotSizeSqft" (input)="onFloorPlotChange(floor)" class="ngq-input" min="0" />
          <button type="button" class="ngq-remove" (click)="removeFloor(i)">&times;</button>
        </div>
        <div class="ngq-subfields">
          <div>
            <label>Core house</label>
            <input type="number" [(ngModel)]="floor.coreHouseSqft" class="ngq-input" min="0" />
          </div>
          <div>
            <label>Finishing house</label>
            <input type="number" [value]="floor.finishingHouseSqft" class="ngq-input" readonly />
          </div>
        </div>
      </div>
      <button type="button" class="ngq-add" (click)="addFloor()">+ Add Floor</button>
      <div class="ngq-summary">
        <h3>Summary</h3>
        <div>Total Plot Size: <strong>{{ totalPlot() }} sqft</strong></div>
        <div>Total Core House: <strong>{{ totalCore() }} sqft</strong></div>
        <div>Total Finishing House: <strong>{{ totalFinishing() }} sqft</strong></div>
      </div>
      <div class="ngq-note">Note: Payment terms are indicative and may change subject to additional requirements or modifications requested by the customer.</div>
    </div>
  `,
  styles: [`
    .ngq-root { max-width: 500px; margin: 32px auto; padding: 24px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; font-family: sans-serif; }
    .ngq-heading { text-align: center; color: #2a3b8f; margin-bottom: 24px; }
    .ngq-section { display: flex; align-items: center; margin-bottom: 8px; }
    .ngq-label { flex: 1; font-weight: 500; }
    .ngq-input { width: 120px; margin-left: 16px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; }
    .ngq-subfields { display: flex; gap: 24px; margin-bottom: 16px; }
    .ngq-subfields label { font-size: 0.95em; }
    .ngq-floor { border-top: 1px solid #eee; padding-top: 12px; margin-top: 12px; }
    .ngq-add { background: #1976d2; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 16px; }
    .ngq-remove { background: #e53935; color: #fff; border: none; border-radius: 50%; width: 28px; height: 28px; font-size: 1.2em; margin-left: 8px; cursor: pointer; }
    .ngq-summary { background: #f5f5f5; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
    .ngq-summary h3 { margin-top: 0; }
    .ngq-note { color: #e53935; font-size: 0.95em; text-align: center; margin-top: 16px; }
  `]
})
export class NextgenQuoteCalculatorComponent {
  ground: Floor = { plotSizeSqft: 0, coreHouseSqft: 0, finishingHouseSqft: 0 };
  floors: Floor[] = [];

  onFloorPlotChange(floor: Floor) {
    const p = Number(floor.plotSizeSqft) || 0;
    floor.finishingHouseSqft = p;
  }

  addFloor() {
    this.floors.push({ plotSizeSqft: 0, coreHouseSqft: 0, finishingHouseSqft: 0 });
  }

  removeFloor(i: number) {
    this.floors.splice(i, 1);
  }

  totalPlot(): number {
    let sum = Number(this.ground.plotSizeSqft) || 0;
    for (const f of this.floors) sum += Number(f.plotSizeSqft) || 0;
    return sum;
  }

  totalCore(): number {
    let sum = Number(this.ground.coreHouseSqft) || 0;
    for (const f of this.floors) sum += Number(f.coreHouseSqft) || 0;
    return sum;
  }

  totalFinishing(): number {
    let sum = Number(this.ground.finishingHouseSqft) || 0;
    for (const f of this.floors) sum += Number(f.finishingHouseSqft) || 0;
    return sum;
  }
}
