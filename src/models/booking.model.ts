import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  DataType,
  Model,
  Table,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { User } from 'models/users.model';

interface BookingCreationAttrs {
  start_day: string;
  end_day: string;
  type: string;
  status: string;
  userId: number;
}

enum Status {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

enum VacationType {
  SICK_LEAVE = 'sick_leave',
  VACATION = 'vacation',
}

@Table({ tableName: 'booking' })
export class Booking extends Model<Booking, BookingCreationAttrs> {
  @ApiProperty({ example: '1', description: 'unique' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: '12-12-2021', description: 'Start day' })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  start_day: Date;

  @ApiProperty({ example: '15-12-2021', description: 'End day' })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  end_day: Date;

  // не понятно
  @ApiProperty({ example: 'vacation', description: 'vacation type' })
  @Column({
    type: DataType.ENUM('sick leave', 'vacation'),
    defaultValue: 'vacation',
  })
  type: VacationType;

  @ApiProperty({ example: 'vacation', description: 'vacation type' })
  @Column({
    type: DataType.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  })
  status: Status;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  userId: number;

  @BelongsTo(() => User)
  author: User;
}