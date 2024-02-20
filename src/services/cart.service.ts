import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {AdminRepository, CartRepository, ProductVariantRepository} from '../repositories';
import {CartKeys} from '../shared/keys/cart.keys';

@injectable({scope: BindingScope.TRANSIENT})
export class CartService {
  constructor(
    @repository(AdminRepository)
    public adminRepository: AdminRepository,
    @repository(ProductVariantRepository)
    public productVariantRepository: ProductVariantRepository,
    @repository(CartRepository)
    public cartRepository: CartRepository
  ) { }

  async create(
    payload: {
      productVariantId: string,
      quantity: number;
    },
    req: any
  ) {
    const {user} = req;
    const admin = await this.adminRepository.findOne({
      where: {
        id: user.id,
        isDeleted: false,
      },
    });
    if (!admin) {
      return {
        statusCode: 404,
        message: CartKeys.ADMIN_ERR,
      };
    }

    const product = await this.productVariantRepository.findOne({
      where: {
        id: payload.productVariantId,
        isDeleted: false,
      },
    });
    if (!product) {
      return {
        statusCode: 404,
        message: CartKeys.PRODUCT_NOT_FOUND
      };
    }

    if (product.stock < payload.quantity) {
      throw new Error(CartKeys.OUT_OF_STOCK);
    }

    let stock = product.stock;

    const cart = await this.cartRepository.findOne({
      where: {
        customerId: user.id,
        isDeleted: false,
      },
    });
    if (cart) {
      let Products = [];
      let ProductIds = [];
      ProductIds = cart.productIds;
      Products = cart.products;
      let total_price = cart.totalPrice;
      Products.push(product);
      ProductIds.push(product.id);
      total_price = total_price + product.price * payload.quantity;
      let totalItems = Products.length;

      const newCart = await this.cartRepository.updateById(cart.id, {
        customerId: user.id,
        productIds: ProductIds,
        products: Products,
        totalItems: totalItems,
        totalPrice: total_price,
      });

      const newProduct = await this.productVariantRepository.updateById(product.id, {
        stock: stock - payload.quantity,
      });
      return {
        statusCode: 200,
        message: CartKeys.PRODUCT_ADDED,
        Products,
      };
    }

    let Products = [];
    let ProductIds = [];
    Products.push(product);
    ProductIds.push(product.id);
    const totalItems = Products.length;
    const newCart = await this.cartRepository.create({
      customerId: user.id,
      productIds: ProductIds,
      products: Products,
      totalItems: totalItems,
      totalPrice: product.price,
    });

    const newProduct = await this.productVariantRepository.updateById(product.id, {
      stock: stock - payload.quantity,
    });
    return {
      statusCode: 200,
      message: CartKeys.PRODUCT_ADDED,
      Products,
    };
  }

  async countCart() {
    const chekCart = await this.cartRepository.count({
      isDeleted: false
    });
    if (!chekCart) {
      return {
        statusCode: 404,
        message: CartKeys.CART_NOT_FOUND
      };
    }
    const result = chekCart.count ?? 0;
    return {
      statusCode: 200,
      message: CartKeys.CART,
      data: result,
    }
  }

  async findAll(req: any) {
    const {user} = req;

    const chekCart = await this.cartRepository.find({
      where: {
        customerId: user.id,
        isDeleted: false,
      }
    });
    if (!chekCart || chekCart.length === 0) {
      return {
        statusCode: 404,
        message: CartKeys.CART_NOT_FOUND
      };
    }
    return {
      statusCode: 200,
      message: CartKeys.CART,
      data: chekCart,
    }
  }

  async update(id: string, payload: {productVariantId: string, quantity: number}, req: any) {
    const {user} = req;

    const cart = await this.cartRepository.findOne({
      where: {
        customerId: user.id,
        isDeleted: false,
      },
    });
    if (!cart) {
      return {
        statusCode: 404,
        message: CartKeys.CART_NOT_FOUND
      };
    }
    const product = await this.productVariantRepository.findOne({
      where: {
        id: payload.productVariantId,
        isDeleted: false,
      },
    });
    if (!product) {
      return {
        statusCode: 404,
        message: CartKeys.PRODUCT_NOT_FOUND
      };
    }
    let Products = [];
    let ProductIds = [];
    ProductIds = cart.productIds;
    Products.push(cart.products);
    let total_price = cart.totalPrice;
    Products.push(product);
    ProductIds.push(product.id);
    total_price = total_price + product.price * payload.quantity;
    let totalItems = Products.length;

    const newProduct = await this.productVariantRepository.updateById(product.id, {
      stock: payload.quantity,
    });

    return this.cartRepository.updateById(cart.id, {
      customerId: user.id,
      productIds: ProductIds,
      products: Products,
      totalItems: totalItems,
      totalPrice: total_price,
    });
  }

  async delete(id: string, req: any) {
    const {user} = req;
    const cart = await this.cartRepository.findOne({
      where: {
        customerId: user.id,
        isDeleted: false,
      },
    });
    if (!cart) {
      return {
        statusCode: 404,
        message: CartKeys.CART_NOT_FOUND
      };
    }
    const product = await this.productVariantRepository.findOne({
      where: {
        id: id,
        isDeleted: false,
      },
    });

    if (!product) {
      return {
        statusCode: 404,
        message: CartKeys.PRODUCT_NOT_FOUND
      };
    }

    let Products = [];
    let ProductIds = [];
    ProductIds = cart.productIds;
    Products.push(cart.products);
    let total_price = cart.totalPrice;
    let totalItems = Products.length;
    const index = ProductIds.indexOf(id);
    if (index > -1) {
      ProductIds.splice(index, 1);
    }
    if (index > -1) {
      Products.splice(index, 1);
    }
    total_price = total_price - product.price;
    totalItems = totalItems - 1;
    const newCart = await this.cartRepository.updateById(cart.id, {
      customerId: user.id,
      productIds: ProductIds,
      products: Products,
      totalItems: totalItems,
      totalPrice: total_price,
    });
    const newProduct = await this.productVariantRepository.updateById(product.id, {
      stock: product.stock + 1,
    });

    return {
      statusCode: 200,
      message: CartKeys.PRODUCT_REMOVED,
      Products,
    };
  }
}
