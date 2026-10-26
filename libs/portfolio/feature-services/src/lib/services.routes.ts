import { Routes } from '@angular/router';
import { ContactPage } from './contact-page';
import { ServicesPage } from './services-page';

export const servicesRoutes: Routes = [{ path: '', component: ServicesPage }];

export const contactRoutes: Routes = [{ path: '', component: ContactPage }];
