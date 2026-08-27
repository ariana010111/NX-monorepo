import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly navItems = [
    { label: 'Shop', link: '/' },
    { label: 'New In', link: '/' },
    { label: 'Best Sellers', link: '/' },
    { label: 'Brands', link: '/' },
  ];

  protected readonly categories = ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Body Care', 'Tools'];
}
