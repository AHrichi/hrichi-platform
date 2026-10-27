import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.scss'],
})
export class HelpPageComponent {
  readonly themeService = inject(ThemeService);
  readonly isDarkMode = this.themeService.isDarkMode;
}
