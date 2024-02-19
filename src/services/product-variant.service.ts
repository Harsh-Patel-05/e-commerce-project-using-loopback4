import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {AdminRepository, ProductRepository, ProductVariantRepository} from '../repositories';
import {ProductKeys} from '../shared/keys/products.keys';

@injectable({scope: BindingScope.TRANSIENT})
export class ProductVariantService {
  constructor(
    @repository(ProductVariantRepository)
    public productVariantRepository: ProductVariantRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(AdminRepository)
    public adminRepository: AdminRepository) { }

  //create product-variant repository
  async create(
    payload: {
      productId: string,
      size: string,
      color: string,
      stock: number,
      price: number
    },
    adminId: string,
  ) {
    const admin = await this.adminRepository.findOne({
      where: {
        id: adminId,
        isDeleted: false,
      },
    });

    if (!admin) {
      return {
        statusCode: 404,
        message: ProductKeys.ONLY_ADMIN
      };
    }
    const product = await this.productRepository.findOne({
      where: {
        id: payload.productId,
        isDeleted: false,
      },
    });
    if (!product) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_NOT_FOUND
      };
    }
    const productVariant = await this.productVariantRepository.create({
      productId: payload.productId,
      size: payload.size,
      color: payload.color,
      stock: payload.stock,
      price: payload.price
    });
    return {
      statusCode: 200,
      message: ProductKeys.PRODUCT_VARIANT_CREATED,
      data: productVariant,
    };
  }


  //count product-variant repository
  async count() {
    const chekProductVariant = await this.productVariantRepository.count({
      isDeleted: false
    });
    if (!chekProductVariant) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_VARIANT_NOT_FOUND
      };
    }
    const result = chekProductVariant.count ?? 0;
    return {
      statusCode: 200,
      message: ProductKeys.PRODUCT_VARIANT_FETCHED_SUCCESSFULLY,
      data: result,
    }
  }

  //findAll product-variant repository
  async findAll() {
    const chekProductVariant = await this.productVariantRepository.find({
      where: {
        isDeleted: false
      }
    });
    if (!chekProductVariant || chekProductVariant.length === 0) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_VARIANT_NOT_FOUND
      };
    }
    return {
      statusCode: 200,
      message: ProductKeys.PRODUCT_VARIANT_FETCHED_SUCCESSFULLY,
      data: chekProductVariant,
    }
  }

  //findById product-variant repository
  async findById(id: string) {
    const chekProductVariant = await this.productVariantRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    });
    if (!chekProductVariant) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_VARIANT_NOT_FOUND
      };
    }
    return {
      statusCode: 200,
      message: ProductKeys.PRODUCT_VARIANT_FETCHED_SUCCESSFULLY,
      data: chekProductVariant,
    }
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
    },
    adminId: string) {
    const admin = await this.adminRepository.findOne({
      where: {
        id: adminId,
      },
    });
    if (!admin) {
      return {
        statusCode: 404,
        message: ProductKeys.ONLY_ADMIN,
      };
    }
    const chekProductVariant = await this.productVariantRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    });
    if (!chekProductVariant) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_VARIANT_NOT_FOUND,
      }
    }
    const result = await this.productVariantRepository.updateById(id, payload);
    return {
      statusCode: 200,
      message: ProductKeys.PRODUCT_VARIANT_UPDATED,
      result,
    };
  }

  //delete product-variant repository
  async deleteById(id: string, adminId: string) {
    const admin = await this.adminRepository.findOne({
      where: {
        id: adminId,
        isDeleted: false,
      },
    });
    if (!admin) {
      return {
        statusCode: 404,
        message: ProductKeys.ONLY_ADMIN
      };
    }
    const chekProductVariant = await this.productVariantRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    });
    if (!chekProductVariant) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_VARIANT_NOT_FOUND
      }
    }
    await this.productVariantRepository.updateById(id, {
      isDeleted: true
    });
    return {
      statusCode: 200,
      message: ProductKeys.PRODUCT_VARIANT_DELETED
    }
  }
}
