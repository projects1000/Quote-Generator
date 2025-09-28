import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NextgenQuoteCalculatorComponent } from './nextgen-quote-calculator.component';

describe('NextgenQuoteCalculatorComponent', () => {
  let component: NextgenQuoteCalculatorComponent;
  let fixture: ComponentFixture<NextgenQuoteCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NextgenQuoteCalculatorComponent ],
      imports: [ FormsModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NextgenQuoteCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add and remove floors', () => {
    expect(component.floors.length).toBe(0);
    component.addFloor();
    expect(component.floors.length).toBe(1);
    component.removeFloor(0);
    expect(component.floors.length).toBe(0);
  });

  it('should calculate totals correctly', () => {
    component.ground.plotSizeSqft = 100;
    component.ground.coreHouseSqft = 50;
    component.ground.finishingHouseSqft = 100;
    component.floors = [
      { plotSizeSqft: 80, coreHouseSqft: 40, finishingHouseSqft: 80 },
      { plotSizeSqft: 60, coreHouseSqft: 30, finishingHouseSqft: 60 }
    ];
    expect(component.totalPlot()).toBe(240);
    expect(component.totalCore()).toBe(120);
    expect(component.totalFinishing()).toBe(240);
  });
});
