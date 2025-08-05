import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
export enum UserRole { ADMIN = 'admin', ANALYST = 'analyst', VIEWER = 'viewer' }
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column() password_hash: string;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.ANALYST }) role: UserRole;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}