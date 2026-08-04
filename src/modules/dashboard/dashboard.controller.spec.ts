import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  it('allows superadmins and storeowners', () => {
    expect(Reflect.getMetadata(ROLES_KEY, DashboardController.prototype.overview)).toEqual([
      UserRole.SUPERADMIN,
      UserRole.STOREOWNER,
    ]);
  });
});
