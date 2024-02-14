import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ProductVariant} from '../models';
import {ProductRepository, ProductVariantRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class ProductVariantService {
  constructor(
    @repository(ProductVariantRepository)
    public productVariantRepository: ProductVariantRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository) { }

  //create product-variant repository
  async create(
    productId: string,
    size: string,
    color: string,
    stock: number,
    price: number
  ) {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        isDeleted: false,
      },
    });
    if (product) {
      const data = await this.productVariantRepository.create({
        productId: productId,
        size: size,
        color: color,
        stock: stock,
        price: price
      });
      return {
        statusCode: 200,
        message: 'created successfully',
        data,
      };
    } else {
      return {
        statusCode: 400,
        message: 'Cannot find product',
      };
    }
  }

  //count product-variant repository
  async count(): Promise<number> {
    const result = await this.productVariantRepository.count({
      isDeleted: false
    });
    return result.count ?? 0;
  }

  //findAll product-variant repository
  async findAll(): Promise<ProductVariant[]> {
    return this.productVariantRepository.find({
      where: {
        isDeleted: false
      }
    });
  }

  //findById product-variant repository
  async findById(id: string): Promise<ProductVariant | null> {
    return this.productVariantRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    })
  }

  //updateById product-variant repository
  async updateById(
    id: string,
    payload: {
      productId: string,
      size: string,
      color: string,
      stock: number,
      price: number
    }) {
    const existingData = await this.productVariantRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    });
    if (!existingData) {
      return {
        statusCode: 404,
        message: 'Data not found'
      }
    }
    const result = await this.productVariantRepository.updateById(id, payload);
    return {
      statusCode: 200,
      message: 'Data Updated successfully',
      result,
    };
  }

  //delete product-variant repository
  async deleteById(id: string) {
    const existingData = await this.productVariantRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    });
    if (!existingData) {
      return {
        statusCode: 404,
        message: 'Product-Variant data already deleted'
      }
    }
    const result = await this.productVariantRepository.updateById(id, {
      isDeleted: true
    });
    return {
      statusCode: 200,
      message: "Delete successfully",
    }
  }
}
