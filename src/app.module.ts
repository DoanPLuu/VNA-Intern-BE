import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationModule } from './modules/location/location.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    // Config toàn cục
    ConfigModule.forRoot({ isGlobal: true }),

    // TypeORM + PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME', 'auth_db'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    LocationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
