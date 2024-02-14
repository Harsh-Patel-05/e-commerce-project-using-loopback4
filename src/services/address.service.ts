import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Address} from '../models';
import {AddressRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AddressService {
  constructor(@repository(AddressRepository)
  public addressRepository: AddressRepository) { }

  //create address repository
  async createAddress(
    street: string,
    city: string,
    state: string,
    phone: number,
    pincode: number): Promise<Address> {
    return this.addressRepository.create({
      street: street,
      city: city,
      state: state,
      phone: phone,
      pincode: pincode
    });
  }

  //count address repository
  async countAddress(): Promise<number> {
    const result = await this.addressRepository.count({
      isDeleted: false
    });

    return result.count ?? 0;
  }

  //find address repository
  async findAll(): Promise<Address[]> {
    return this.addressRepository.find({
      where: {
        isDeleted: false
      }
    });
  }

  //findById address repository
  async findAddressById(id: string): Promise<Address | null> {
    return this.addressRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  //update address repository
  async updateAddressById(
    id: string,
    payload: {
      street: string,
      city: string,
      state: string,
      phone: number,
      pincode: number
    },
  ) {
    const existingData = await this.addressRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingData) {
      return {
        statusCode: 404,
        message: 'Data Not Found',
      };
    }

    const result = await this.addressRepository.updateById(id, {
      street: payload.street,
      city: payload.city,
      state: payload.state,
      phone: payload.phone,
      pincode: payload.pincode
    });

    return {
      statusCode: 200,
      message: 'Data Updated successfully',
      result,
    };
  }

  //delete address repository
  async deleteAddressById(id: string) {
    const existingData = await this.addressRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingData) {
      return {
        statusCode: 404,
        message: 'Address data already deleted',
      };
    }

    const result = await this.addressRepository.updateById(id, {
      isDeleted: true,
    });

    return {
      statusCode: 200,
      message: 'Deleted Successfully',
    };
  }

}
