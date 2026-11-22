import { Component, input } from '@angular/core';

@Component({
  selector: 'app-field-errors',
  template: `
    @if (visible() && errors().length) {
      <div class="d-block invalid-feedback" [id]="errorId()">{{ errors()[0].message }}</div>
    }
  `,
})
export class FieldErrors {
  readonly errors = input.required<readonly { message?: string }[]>();
  readonly visible = input.required<boolean>();
  readonly errorId = input.required<string>();
}
