import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {AdminRepository, CategoryRepository, ProductRepository} from '../repositories';
import {CategoryKeys} from '../shared/keys/category.keys';
import {ProductKeys} from '../shared/keys/products.keys';

@injectable({scope: BindingScope.TRANSIENT})
export class ProductService {
  constructor(
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(CategoryRepository)
    public categoryRepository: CategoryRepository,
    @repository(AdminRepository)
    public adminRepository: AdminRepository) { }

  //create product repository
  async create(
    payload: {
      categoryId: string,
      name: string,
      description: string,
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

    const category = await this.categoryRepository.findOne({
      where: {
        id: payload.categoryId,
        isDeleted: false,
      },
    });

    if (category) {
      const data = await this.productRepository.create({
        categoryId: payload.categoryId,
        name: payload.name,
        description: payload.description,
      });

      return {
        statusCode: 200,
        message: ProductKeys.PRODUCT_CREATED,
        data,
      };
    } else {
      return {
        statusCode: 404,
        message: CategoryKeys.CATEGORY_NOT_FOUND,
      };
    }
  }

  //count product repository
  async countProduct() {
    const chekProduct = await this.productRepository.count({
      isDeleted: false
    });
    if (!chekProduct) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_NOT_FOUND
      };
    }
    const result = chekProduct.count ?? 0;
    return {
      statusCode: 200,
      message: ProductKeys.FETCHED_SUCCESSFULLY,
      data: result,
    }
  }

  //find product repository
  async findAll() {
    const chekProduct = await this.productRepository.find({
      where: {
        isDeleted: false
      }
    });
    if (!chekProduct || chekProduct.length === 0) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_NOT_FOUND
      };
    }
    return {
      statusCode: 200,
      message: ProductKeys.FETCHED_SUCCESSFULLY,
      data: chekProduct,
    }
  }

  //findById product repository
  async findById(id: string) {  
    const chekProduct = await this.productRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    });
    if (!chekProduct) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_NOT_FOUND
      };
    }
    return {
      statusCode: 200,
      message: ProductKeys.FETCHED_SUCCESSFULLY,
      data: chekProduct,
    }
  }

  //update product repository
  async updateById(id: string, payload: {categoryId: string, name: string, description: string}, adminId: string) {
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
    const checkProduct = await this.productRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!checkProduct) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_NOT_FOUND,
      };
    }
    const result = await this.productRepository.updateById(id, payload);
    return {
      statusCode: 200,
      message: ProductKeys.PRODUCT_UPDATED,
      data: result,
    };
  }

  //delete product repository
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
    const checkProduct = await this.productRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!checkProduct) {
      return {
        statusCode: 404,
        message: ProductKeys.PRODUCT_NOT_FOUND
      };
    }
    const result = await this.productRepository.updateById(id, {isDeleted: true});
    return {
      statusCode: 200,
      message: ProductKeys.PRODUCT_DELETED,
      data: result
    };
  }
}
