import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimeNgModule } from './primeng.module';

// import { FileUploadPreviewComponent } from './components/file-upload-preview/file-upload-preview.component';
// import { DndDirective } from './components/file-upload-preview/dnd.directive';
// import { ConfirmDialogComponent } from './utils/dialogs/confirm-dialog/confirm-dialog.component';
// import { AlertDialogComponent } from './utils/dialogs/alert-dialog/alert-dialog.component';
// import { GooglePayButtonModule } from '@google-pay/button-angular';


// const COMPONENTS = [
//   AlertDialogComponent,
//   ConfirmDialogComponent,
//   FileUploadPreviewComponent,
// ];

@NgModule({
  declarations: [
    // ...COMPONENTS,
    // DndDirective,    
  ],
  imports: [
    CommonModule,
    PrimeNgModule
    // FontAwesomeModule,
    // BaseChartDirective,
    // GooglePayButtonModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PrimeNgModule
    // FlexLayoutModule,
    // MaterialModule,
    // NgScrollbarModule,
    // FontAwesomeModule,
    // BaseChartDirective,
    // GooglePayButtonModule,
    //...COMPONENTS
  ],
})
export class SharedModule { 
}
