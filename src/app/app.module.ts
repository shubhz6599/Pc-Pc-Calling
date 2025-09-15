import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SupplierCallComponent } from './supplier-call/supplier-call.component';
import { AgentDashboardComponent } from './agent-dashboard/agent-dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    SupplierCallComponent,
    AgentDashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
