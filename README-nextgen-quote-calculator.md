# NextGEN Infra Quote Calculator Component

This Angular component provides a simple UI for calculating house/floor sizes and totals for a construction quote.

## Features
- Heading: "NextGEN Infra Quote Calculator"
- Input for Total Ground Floor Plot Size
- Subfields: Core house (default 0), Finishing house (equals plot size, readonly)
- Add/remove additional floors, each with Plot Size, Core house, Finishing house
- Summary of totals
- Note at the bottom in red

## Usage

1. **Copy the files:**
   - `src/app/nextgen-quote-calculator.component.ts`
   - `src/app/nextgen-quote-calculator.component.spec.ts`

2. **Import FormsModule:**
   In your app module (`app.module.ts`):
   ```typescript
   import { FormsModule } from '@angular/forms';
   import { NextgenQuoteCalculatorComponent } from './nextgen-quote-calculator.component';

   @NgModule({
     declarations: [
       // ...other components
       NextgenQuoteCalculatorComponent
     ],
     imports: [
       // ...other modules
       FormsModule
     ],
     // ...
   })
   export class AppModule {}
   ```

3. **Use the component in your template:**
   ```html
   <app-nextgen-quote-calculator></app-nextgen-quote-calculator>
   ```

4. **Style:**
   The component includes its own styles, but you can further customize as needed.

## Notes
- All calculations are in square feet (sqft).
- The note at the bottom is for customer awareness.
