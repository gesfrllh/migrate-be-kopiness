import { IsLatitude, IsLongitude } from 'class-validator'

export class UpdateCourierLocationDto {
  @IsLatitude()
  latitude: number

  @IsLongitude()
  longitude: number
}
