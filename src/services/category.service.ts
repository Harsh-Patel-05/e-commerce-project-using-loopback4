import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {AdminRepository, CategoryRepository} from '../repositories';
import {CategoryKeys} from '../shared/keys/category.keys';

@injectable({scope: BindingScope.TRANSIENT})
export class CategoryService {
  constructor(
    @repository(AdminRepository)
    public adminRepository: AdminRepository,
    @repository(CategoryRepository)
    public categoryRepository: CategoryRepository

  ) { }

  //create category repository
  async createCategory(name: string, adminId: string) {
    const admin = await this.adminRepository.findOne({
      where: {
        id: adminId,
      },
    });
    if (!admin) {
      return {
        statusCode: 404,
        message: CategoryKeys.ONLY_ADMIN
      };
    }
    const category = await this.categoryRepository.create({name});

    return {
      statusCode: 200,
      message: CategoryKeys.CATEGORY_CREATED,
      data: category,
    };
  }

  //count category repository
  async countCategory() {
    const chekCategory = await this.categoryRepository.count({
      isDeleted: false
    });
    if (!chekCategory) {
      return {
        statusCode: 404,
        message: CategoryKeys.CATEGORY_NOT_FOUND
      };
    }
    const result = chekCategory.count ?? 0;
    return {
      statusCode: 200,
      message: CategoryKeys.FETCHED_SUCCESSFULLY,
      data: result,
    }
  }

  //findAll category repository
  async findCategory() {
    const chekCategory = await this.categoryRepository.find({
      where: {
        isDeleted: false
      }
    });
    if (!chekCategory || chekCategory.length === 0) {
      return {
        statusCode: 404,
        message: CategoryKeys.CATEGORY_NOT_FOUND
      };
    }
    return {
      statusCode: 200,
      message: CategoryKeys.FETCHED_SUCCESSFULLY,
      data: chekCategory,
    }
  }

  //findById category repository
  async findCategoryById(id: string) {
    const chekCategory = await this.categoryRepository.findOne({
      where: {
        id,
        isDeleted: false
      }
    });
    if (!chekCategory) {
      return {
        statusCode: 404,
        message: CategoryKeys.CATEGORY_NOT_FOUND
      };
    }
    return {
      statusCode: 200,
      message: CategoryKeys.FETCHED_SUCCESSFULLY,
      data: chekCategory,
    }
  }

  //updateById category repository
  async updateCategoryById(id: string, payload: {name: string}, adminId: string) {
    const admin = await this.adminRepository.findOne({
      where: {
        id: adminId,
      },
    });
    if (!admin) {
      return {
        statusCode: 404,
        message: CategoryKeys.ONLY_ADMIN,
      };
    }
    const checkCategory = await this.categoryRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!checkCategory) {
      return {
        statusCode: 404,
        message: CategoryKeys.CATEGORY_NOT_FOUND,
      };
    }
    const result = await this.categoryRepository.updateById(id, payload);
    return {
      statusCode: 200,
      message: CategoryKeys.CATEGORY_UPDATED,
      data: result,
    };
  }

  //delete category repository
  async deleteCategoryById(id: string, adminId: string) {
    const admin = await this.adminRepository.findOne({
      where: {
        id: adminId,
        isDeleted: false,
      },
    });
    if (!admin) {
      return {
        statusCode: 404,
        message: CategoryKeys.ONLY_ADMIN
      };
    }
    const checkCategory = await this.categoryRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!checkCategory) {
      return {
        statusCode: 404,
        message: CategoryKeys.CATEGORY_NOT_FOUND
      };
    }
    const result = await this.categoryRepository.updateById(id, {isDeleted: true});
    return {
      statusCode: 200,
      message: CategoryKeys.CATEGORY_DELETED,
      data: result
    };
  }
}
