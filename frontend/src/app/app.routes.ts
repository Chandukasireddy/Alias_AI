import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DocsComponent } from './pages/docs/docs.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Alias AI — Zero-Knowledge Privacy Airgap Gateway' },
  { path: 'docs', component: DocsComponent, title: 'Documentation | Alias AI' },
  { path: '**', redirectTo: '' }
];

