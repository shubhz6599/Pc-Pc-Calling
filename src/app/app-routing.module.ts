import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupplierCallComponent } from './supplier-call/supplier-call.component';
import { AgentDashboardComponent } from './agent-dashboard/agent-dashboard.component';

const routes: Routes = [
  { path: '', component: SupplierCallComponent },
  { path: 'agent', component: AgentDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
