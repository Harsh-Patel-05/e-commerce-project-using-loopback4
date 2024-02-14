import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Product} from '../models';
import {CategoryRepository, ProductRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class ProductService {
  constructor(
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(CategoryRepository)
    public categoryRepository: CategoryRepository) { }

  //create product repository
  async create(
    categoryId: string,
    name: string,
    description: string,
  ) {
    const category = await this.categoryRepository.findOne({
      where: {
        id: categoryId,
        isDeleted: false,
      },
    });

    if (category) {
      const data = await this.productRepository.create({
        categoryId: categoryId,
        name: name,
        description: description,
      });
      return {
        statusCode: 200,
        message: 'created successfully',
        data,
      };
    } else {
      return {
        statusCode: 400,
        message: 'Cannot find category',
      };
    }
  }

  //count product repository
  async countProduct(): Promise<number> {
    const result = await this.productRepository.count({
      isDeleted: false,
    });
    return result.count ?? 0;
  }

  //find product repository
  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        isDeleted: false,
      }
    });
  }

  //findById product repository
  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  //update product repository
  async updateById(id: string, payload: {categoryId: string, name: string, description: string}) {
    const existingData = await this.productRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!existingData) {
      return {
        statusCode: 404,
        message: 'Data not found'
      }
    }
    const result = await this.productRepository.updateById(id, payload);
    return {
      statusCode: 200,
      message: 'Data Updated successfully',
      result,
    };
  }

  //delete product repository
  async deleteProductById(id: string) {
    const existingData = await this.productRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    });
    if (!existingData) {
      return {
        statusCode: 404,
        message: 'Product data already deleted'
      }
    }
    const result = await this.productRepository.updateById(id, {
      isDeleted: true
    });
    return {
      statusCode: 200,
      message: "Delete successfully",
    }
  }
}
