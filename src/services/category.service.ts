import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Category} from '../models';
import {CategoryRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class CategoryService {
  constructor(
    @repository(CategoryRepository)
    public categoryRepository: CategoryRepository
  ) { }

  //create category repository
  async createCategory(
    name: string,
  ) {
    return this.categoryRepository.create({
      name: name,
    });
  }

  //count category repository
  async countCategory(): Promise<number> {
    const result = await this.categoryRepository.count({
      isDeleted: false
    });
    return result.count ?? 0;
  }

  //findAll category repository
  async findCategory(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: {
        isDeleted: false
      }
    });
  }

  //findById category repository
  async findCategoryById(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    })
  }

  //updateById category repository
  async updateCategoryById(
    id: string,
    payload: {
      name: string
    }) {
    const existingData = await this.categoryRepository.findOne({
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
    const result = await this.categoryRepository.updateById(id, payload);
    return {
      statusCode: 200,
      message: 'Data Updated successfully',
      result,
    };
  }

  //delete category repository
  async deleteCategoryById(id: string) {
    const existingData = await this.categoryRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    });
    if (!existingData) {
      return {
        statusCode: 404,
        message: 'category data already deleted'
      }
    }
    const result = await this.categoryRepository.updateById(id, {
      isDeleted: true
    });
    return {
      statusCode: 200,
      message: "Delete successfully",
    }
  }
}
