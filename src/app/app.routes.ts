import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SoloComponent } from './components/solo/solo.component';

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'solo', component: SoloComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
];
