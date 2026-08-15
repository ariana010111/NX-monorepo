import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogModule } from './catalog/catalog.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';

@Module({
  imports: [CatalogModule, CategoriesModule, BrandsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
