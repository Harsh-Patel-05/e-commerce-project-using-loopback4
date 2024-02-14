import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Address} from '../models';
import {AddressRepository, CustomerRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AddressService {
  constructor(
    @repository(AddressRepository)
    public addressRepository: AddressRepository,
    @repository(CustomerRepository)
    public customerRepository: CustomerRepository) { }

  //create address repository
  async createAddress(
    customerId: string,
    street: string,
    city: string,
    state: string,
    phone: number,
    pincode: number) {
    const customer = await this.customerRepository.findOne({
      where: {
        id: customerId,
        isDeleted: false,
      },
    });
    if (customer) {
      const data = await this.addressRepository.create({
        customerId: customerId,
        street: street,
        city: city,
        state: state,
        phone: phone,
        pincode: pincode
      });
      return {
        statusCode: 200,
        message: 'created successfully',
        data,
      };
    } else {
      return {
        statusCode: 400,
        message: 'Cannot find customer',
      };
    }
  }

  //count address repository
  async countAddress(): Promise<number> {
    const result = await this.addressRepository.count({
      isDeleted: false
    });

    return result.count ?? 0;
  }

  //find address repository
  async findAddress(): Promise<Address[]> {
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
      customerId: string,
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

    const result = await this.addressRepository.updateById(id, payload);

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
