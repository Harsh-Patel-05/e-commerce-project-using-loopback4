import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {UserProfile} from '@loopback/security';
import {AddressRepository, ShipmentStatusRepository} from '../repositories';
import {ShipmentKeys} from '../shared/keys/shipment.keys';

@injectable({scope: BindingScope.TRANSIENT})
export class ShipmentStatusService {
  constructor(
    @repository(ShipmentStatusRepository)
    public ShipmentStatusRepository: ShipmentStatusRepository,
    @repository(AddressRepository)
    public addressRepository: AddressRepository
  ) { }

  async findAll(user: UserProfile) {
    const isAdmin = await this.isAdmin(user);
    if (!isAdmin) {
      return {
        statusCode: 404,
        message: ShipmentKeys.ADMIN_NOT_FOUND
      }
    }
    return this.ShipmentStatusRepository.find({
      where: {
        isDeleted: false
      }
    });
  }

  async findById(id: string) {
    return this.ShipmentStatusRepository.findOne({
      where: {
        id: id,
        isDeleted: false
      }
    })
  }

  async deleteById(id: string, user: UserProfile) {
    const isAdmin = await this.isAdmin(user);
    if (!isAdmin) {
      return {
        ststausCode: 404,
        message: ShipmentKeys.ADMIN_NOT_FOUND
      };
    }
    const shipmentCheck = await this.ShipmentStatusRepository.findOne({
      where: {
        id: id,
        isDeleted: false,
      },
    });
    if (!shipmentCheck) {
      return {
        ststausCode: 404,
        message: ShipmentKeys.SHIPMENT_NOT_FOUND
      };
    }
    const shipment = await this.ShipmentStatusRepository.updateById(shipmentCheck.id, {
      isDeleted: true,
    });

    return {
      statusCode: 200,
      message: ShipmentKeys.SHIPMENT_DELETED_SUCCESSFULLY,
    };
  }

  // fucntion for detecting admin
  async isAdmin(user: any) {
    const admin = await this.addressRepository.findOne({
      where: {
        id: user.id,
        isDeleted: false,
      },
    });
    if (admin) {
      return true;
    }
    return false;
  }
}
